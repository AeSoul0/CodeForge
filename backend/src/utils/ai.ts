/**
 * @file backend/src/utils/ai.ts
 * @description AI documentation service for CodeForge projects.
 *
 * Responsibilities:
 * - Collect project metadata.
 * - Optionally collect public GitHub repository context.
 * - Generate technical documentation using the configured LLM provider.
 * - Persist the generated Markdown in MongoDB.
 * - Skip projects that already contain an AI description.
 * - Support forced regeneration for administrative actions.
 * - Scan existing projects and generate documentation only for missing entries.
 */

import { ProjectService } from '../services/ProjectService';
import type { ProjectResponse } from '../dtos/ProjectDTO';

interface GitHubRepositoryContext {
    owner: string;
    repository: string;
    description?: string;
    defaultBranch?: string;
    language?: string;
    topics: string[];
    readme?: string;
    packageJson?: string;
}

interface AiGenerationResult {
    provider: 'openai' | 'gemini';
    model: string;
    content: string;
}

interface OpenAIResponse {
    choices?: Array<{
        message?: {
            content?: string;
        };
    }>;
    error?: {
        message?: string;
    };
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    error?: {
        message?: string;
    };
}

const MAX_CONTEXT_CHARS = 16_000;
const MAX_GENERATED_CHARS = 45_000;

/**
 * Parse a GitHub repository URL into owner/repository coordinates.
 */
function parseGitHubUrl(
    githubUrl?: string | null,
): { owner: string; repository: string } | null {
    if (!githubUrl) {
        return null;
    }

    try {
        const url = new URL(githubUrl);

        if (url.hostname.toLowerCase() !== 'github.com') {
            return null;
        }

        const segments = url.pathname
            .split('/')
            .map((segment) => segment.trim())
            .filter(Boolean);

        if (segments.length < 2) {
            return null;
        }

        const owner = segments[0];
        const repository = segments[1].replace(/\.git$/i, '');

        if (!owner || !repository) {
            return null;
        }

        return {
            owner,
            repository,
        };
    } catch {
        return null;
    }
}

/**
 * Build headers used for GitHub API requests.
 *
 * GITHUB_TOKEN is optional for public repositories but is recommended
 * because it provides a higher GitHub API rate limit.
 */
function getGitHubHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CodeForge-AI',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    const token = process.env.GITHUB_TOKEN?.trim();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Decode a GitHub base64-encoded file.
 */
function decodeGitHubBase64(content: string): string {
    return Buffer.from(
        content.replace(/\n/g, ''),
        'base64',
    ).toString('utf-8');
}

/**
 * Fetch useful context from a public GitHub repository.
 *
 * The AI does not need the entire repository. Repository metadata,
 * README and package.json provide enough context to produce more
 * grounded technical documentation.
 */
async function fetchGitHubContext(
    githubUrl?: string | null,
): Promise<GitHubRepositoryContext | null> {
    const coordinates = parseGitHubUrl(githubUrl);

    if (!coordinates) {
        return null;
    }

    const {
        owner,
        repository,
    } = coordinates;

    const headers = getGitHubHeaders();

    try {
        const repositoryResponse = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
            {
                headers,
            },
        );

        if (!repositoryResponse.ok) {
            console.warn(
                `[AI] GitHub repository metadata request failed with status ${repositoryResponse.status}.`,
            );

            return {
                owner,
                repository,
                topics: [],
            };
        }

        const repositoryData =
            (await repositoryResponse.json()) as {
                description?: string | null;
                default_branch?: string;
                language?: string | null;
                topics?: string[];
            };

        const context: GitHubRepositoryContext = {
            owner,
            repository,
            description:
                repositoryData.description ??
                undefined,
            defaultBranch:
                repositoryData.default_branch,
            language:
                repositoryData.language ??
                undefined,
            topics:
                Array.isArray(repositoryData.topics)
                    ? repositoryData.topics
                    : [],
        };

        /**
         * Fetch README using the GitHub API.
         */
        const readmeResponse = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/readme`,
            {
                headers,
            },
        );

        if (readmeResponse.ok) {
            const readmeData =
                (await readmeResponse.json()) as {
                    content?: string;
                    encoding?: string;
                };

            if (
                readmeData.content &&
                readmeData.encoding === 'base64'
            ) {
                context.readme = decodeGitHubBase64(
                    readmeData.content,
                ).slice(0, MAX_CONTEXT_CHARS);
            }
        }

        /**
         * Fetch package.json from the default branch.
         */
        if (context.defaultBranch) {
            const packageResponse = await fetch(
                `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${encodeURIComponent(context.defaultBranch)}/package.json`,
                {
                    headers: {
                        'User-Agent': 'CodeForge-AI',
                    },
                },
            );

            if (packageResponse.ok) {
                context.packageJson = (
                    await packageResponse.text()
                ).slice(0, MAX_CONTEXT_CHARS);
            }
        }

        return context;
    } catch (error) {
        console.error(
            '[AI] Failed to collect GitHub repository context:',
            error,
        );

        return null;
    }
}

/**
 * Convert GitHub context into prompt-ready text.
 */
function buildGitHubContextSection(
    context: GitHubRepositoryContext | null,
): string {
    if (!context) {
        return `
No public GitHub repository context was available.
Do not invent implementation details that cannot be inferred from the supplied project metadata.
`;
    }

    const sections: string[] = [
        `Repository: ${context.owner}/${context.repository}`,
        `Default branch: ${context.defaultBranch ?? 'unknown'
        }`,
        `Primary language: ${context.language ?? 'unknown'
        }`,
        `Repository topics: ${context.topics.length > 0
            ? context.topics.join(', ')
            : 'none'
        }`,
        `Repository description: ${context.description ?? 'not provided'
        }`,
    ];

    if (context.packageJson) {
        sections.push(`
package.json:
\`\`\`json
${context.packageJson}
\`\`\`
`);
    }

    if (context.readme) {
        sections.push(`
README:
\`\`\`markdown
${context.readme}
\`\`\`
`);
    }

    return sections.join('\n');
}

/**
 * Build the technical documentation prompt.
 */
function buildPrompt(
    project: ProjectResponse,
    githubContext: GitHubRepositoryContext | null,
): string {
    return `
You are a senior software architect writing technical documentation for a professional developer portfolio.

Analyze the project below and write a detailed architectural report in professional US English.

PROJECT METADATA
----------------
Name: ${project.titolo}

Short description:
${project.descrizione}

Technologies:
${project.tecnologie.length > 0
            ? project.tecnologie.join(', ')
            : 'Not specified'
        }

Categories:
${project.categorie && project.categorie.length > 0
            ? project.categorie.join(', ')
            : project.categoria ?? 'Not specified'
        }

GitHub repository:
${project.linkGithub ?? 'Not provided'}

GITHUB CONTEXT
--------------
${buildGitHubContextSection(githubContext)}

WRITING REQUIREMENTS
--------------------
- Start immediately with "### Architectural Overview".
- Write between 500 and 1200 words when sufficient information is available.
- Never invent frameworks, databases, cloud services, modules or patterns.
- Clearly separate observed facts from reasonable architectural inferences.
- Explain how the actual technologies work together.
- Discuss important engineering decisions.
- Discuss scalability and performance only when technically relevant.
- Mention maintainability, testing, deployment, security and observability when supported by the available context.
- Prefer concrete technical explanations over generic marketing language.
- Use GitHub-Flavored Markdown.
- Use headings, paragraphs, bullet lists, bold text, inline code and fenced code blocks when useful.
- Do not include a greeting.
- Do not include a generic conclusion.
- Do not mention these instructions.
- Do not describe yourself as an AI.
`;
}

/**
 * Validate and normalize generated content.
 */
function normalizeGeneratedContent(
    content: string,
): string {
    const normalized = content
        .replace(/\r\n/g, '\n')
        .trim();

    if (!normalized) {
        throw new Error(
            'AI provider returned an empty response.',
        );
    }

    if (
        normalized.length >
        MAX_GENERATED_CHARS
    ) {
        console.warn(
            `[AI] Generated content exceeded ${MAX_GENERATED_CHARS} characters and was truncated.`,
        );

        return normalized
            .slice(0, MAX_GENERATED_CHARS)
            .trimEnd();
    }

    return normalized;
}

/**
 * Generate documentation using OpenAI.
 */
async function generateWithOpenAI(
    prompt: string,
): Promise<AiGenerationResult | null> {
    const apiKey =
        process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
        return null;
    }

    const model =
        process.env.OPENAI_MODEL?.trim() ||
        'gpt-4o-mini';

    const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },

            body: JSON.stringify({
                model,

                temperature: 0.4,

                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an elite software architect producing factual technical documentation.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        },
    );

    const data =
        (await response.json()) as OpenAIResponse;

    if (!response.ok) {
        throw new Error(
            `OpenAI request failed (${response.status}): ${data.error?.message ??
            'Unknown provider error'
            }`,
        );
    }

    const content =
        data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error(
            'OpenAI returned a successful response without message content.',
        );
    }

    return {
        provider: 'openai',
        model,
        content:
            normalizeGeneratedContent(content),
    };
}

/**
 * Generate documentation using Google Gemini.
 */
async function generateWithGemini(
    prompt: string,
): Promise<AiGenerationResult | null> {
    const apiKey =
        process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        return null;
    }

    /**
     * The model can be overridden through GEMINI_MODEL.
     * The current project has been tested successfully with this model.
     */
    const model =
        process.env.GEMINI_MODEL?.trim() ||
        'gemini-3.6-flash';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
            },

            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text:
                                'You are an elite software architect producing factual technical documentation.',
                        },
                    ],
                },

                contents: [
                    {
                        role: 'user',

                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],

                generationConfig: {
                    temperature: 0.4,
                },
            }),
        },
    );

    const data =
        (await response.json()) as GeminiResponse;

    if (!response.ok) {
        throw new Error(
            `Gemini request failed (${response.status}): ${data.error?.message ??
            'Unknown provider error'
            }`,
        );
    }

    const content =
        data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? '')
            .join('')
            .trim();

    if (!content) {
        throw new Error(
            'Gemini returned a successful response without text content.',
        );
    }

    return {
        provider: 'gemini',
        model,
        content:
            normalizeGeneratedContent(content),
    };
}

/**
 * Generate the detailed description for a project.
 */
export async function generateDetailedDescription(
    project: ProjectResponse,
): Promise<AiGenerationResult> {
    const githubContext =
        await fetchGitHubContext(
            project.linkGithub,
        );

    const prompt = buildPrompt(
        project,
        githubContext,
    );

    const providerErrors: string[] = [];

    /**
     * Provider priority:
     * 1. OpenAI
     * 2. Gemini
     */
    if (
        process.env.OPENAI_API_KEY?.trim()
    ) {
        try {
            const result =
                await generateWithOpenAI(
                    prompt,
                );

            if (result) {
                return result;
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown OpenAI error';

            providerErrors.push(
                `OpenAI: ${message}`,
            );

            console.error(
                `[AI] ${message}`,
            );
        }
    }

    if (
        process.env.GEMINI_API_KEY?.trim()
    ) {
        try {
            const result =
                await generateWithGemini(
                    prompt,
                );

            if (result) {
                return result;
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown Gemini error';

            providerErrors.push(
                `Gemini: ${message}`,
            );

            console.error(
                `[AI] ${message}`,
            );
        }
    }

    if (
        !process.env.OPENAI_API_KEY?.trim() &&
        !process.env.GEMINI_API_KEY?.trim()
    ) {
        throw new Error(
            'No AI provider is configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY.',
        );
    }

    throw new Error(
        `All configured AI providers failed. ${providerErrors.join(
            ' | ',
        )}`,
    );
}

/**
 * Process AI documentation for one project.
 *
 * Returns true only when new documentation has been generated and persisted.
 *
 * Rules:
 * - Existing description + force=false -> SKIP.
 * - Missing description -> GENERATE.
 * - force=true -> always GENERATE.
 */
export async function processProjectAI(
    projectId: string,
    force = false,
    triggerDeploy = true,
): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
        return false;
    }

    try {
        console.log(
            `[AI] Starting description generation for project ${projectId}.`,
        );

        const service =
            new ProjectService();

        const project =
            await service.getProjectById(
                projectId,
            );

        /**
         * Existing documentation is authoritative.
         *
         * This prevents repeated API calls every time the backend scans
         * the database.
         */
        if (
            project.descrizioneLunga?.trim() &&
            !force
        ) {
            console.log(
                `[AI] Project ${projectId} already has a detailed description. Skipping generation.`,
            );

            return false;
        }

        const result =
            await generateDetailedDescription(
                project,
            );

        /**
         * Persist the generated Markdown permanently in MongoDB.
         */
        await service.updateProject(
            projectId,
            {
                descrizioneLunga:
                    result.content,
            },
        );

        console.log(
            `[AI] Successfully generated ${result.provider}/${result.model} documentation for project ${projectId}.`,
        );

        /**
         * When processing one project interactively, trigger the deployment
         * immediately after the document has been saved.
         *
         * Startup migration passes false here and performs one deployment
         * after all missing descriptions have been processed.
         */
        if (triggerDeploy) {
            const {
                triggerVercelDeploy,
            } = await import('./vercel');

            await triggerVercelDeploy();
        }

        return true;
    } catch (error) {
        console.error(
            `[AI] Failed to generate documentation for project ${projectId}:`,
            error,
        );

        return false;
    }
}

/**
 * Generate documentation for every existing project that does not already
 * have an AI-generated description.
 *
 * This method is intentionally safe to execute on every backend startup:
 * projects with an existing description are skipped immediately.
 *
 * The function processes projects sequentially to:
 * - Avoid hammering the AI provider.
 * - Avoid excessive GitHub API traffic.
 * - Avoid concurrent database updates.
 * - Avoid triggering one deployment per project.
 */
export async function generateMissingProjectDescriptions(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
        return;
    }
    const service =
        new ProjectService();

    const limit = 50;
    let page = 1;
    let generatedCount = 0;

    console.log(
        '[AI] Scanning existing projects for missing descriptions...',
    );

    try {
        while (true) {
            const projects =
                await service.getAllProjects(
                    page,
                    limit,
                );

            if (projects.length === 0) {
                break;
            }

            for (const project of projects) {
                /**
                 * Already documented projects are ignored permanently.
                 */
                if (
                    project.descrizioneLunga?.trim()
                ) {
                    console.log(
                        `[AI] Skipping ${project.titolo}: description already exists.`,
                    );

                    continue;
                }

                console.log(
                    `[AI] Missing description detected for ${project.titolo}.`,
                );

                /**
                 * Do not trigger a Vercel deployment for every project.
                 */
                const generated =
                    await processProjectAI(
                        project.id,
                        false,
                        false,
                    );

                if (generated) {
                    generatedCount++;
                }
            }

            /**
             * Continue pagination until the current page contains fewer
             * entries than the requested limit.
             */
            if (projects.length < limit) {
                break;
            }

            page++;
        }

        /**
         * Trigger one deployment after all missing descriptions have been
         * generated successfully.
         */
        if (generatedCount > 0) {
            console.log(
                `[AI] Generated ${generatedCount} missing project description(s).`,
            );

            const {
                triggerVercelDeploy,
            } = await import('./vercel');

            await triggerVercelDeploy();
        } else {
            console.log(
                '[AI] No missing project descriptions found.',
            );
        }
    } catch (error) {
        console.error(
            '[AI] Failed while scanning existing projects:',
            error,
        );
    }
}
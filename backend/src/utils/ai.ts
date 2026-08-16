/**
 * @file backend/src/utils/ai.ts
 * @description Background service for generating automated project documentation
 * utilizing Large Language Models (LLMs) such as OpenAI GPT or Google Gemini.
 * It enriches project records with technical deep-dives automatically.
 */

import { ProjectService } from '../services/ProjectService';

// Fallback to a placeholder if no API keys are provided.
export async function generateDetailedDescription(project: any): Promise<string> {
    const prompt = `You are a Senior Software Architect with 20+ years of experience.
Write a highly professional, technically deep, and engaging architectural analysis in Markdown for the following project:

**Project Name:** ${project.titolo}
**Description:** ${project.descrizione}
**Technologies:** ${project.tecnologie.join(', ')}
${project.linkGithub ? `**GitHub Repository:** ${project.linkGithub}` : ''}

**Instructions:**
- Use professional US English.
- Start directly with a markdown h3 "### Architectural Overview" or similar.
- Do NOT include generic greetings or filler text.
- Break down how the listed technologies work together in a production environment.
- Highlight potential scaling strategies, design patterns, and engineering decisions.
- Format beautifully using Markdown (bolding, bullet points, inline code).
`;

    // Here you would connect to OpenAI, Anthropic, or Gemini.
    // For now, if OPENAI_API_KEY exists, we call OpenAI, otherwise we use a mock.
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: 'You are an elite Software Architect.' }, { role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });
            const data: any = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.error('[AI] OpenAI fetch failed:', error);
        }
    }

    if (process.env.GEMINI_API_KEY) {
         try {
             const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: "You are an elite Software Architect." }]},
                    contents: [{ parts: [{ text: prompt }] }]
                })
             });
             const data: any = await response.json();
             if (data.candidates && data.candidates.length > 0) {
                 return data.candidates[0].content.parts[0].text;
             }
         } catch (error) {
             console.error('[AI] Gemini fetch failed:', error);
         }
    }

    // Advanced Fallback if APIs are missing or fail
    return `### Architectural Foundation\n\nThis system, **${project.titolo}**, represents a robust engineering solution built upon a modern stack comprising **${project.tecnologie.join(', ')}**.\n\n### Technical Deep Dive\n\nBased on the core technologies utilized, this application is engineered to handle demanding workloads efficiently:\n\n- **Scalability:** The architecture leverages decoupled components to ensure horizontal scaling capabilities.\n- **Maintainability:** Adherence to clean code principles and modular design guarantees long-term maintainability.\n- **Performance:** Optimized data flow and state management reduce latency and improve the overall user experience.\n\n> **Note for Administrator:** Ensure that \`OPENAI_API_KEY\` or \`GEMINI_API_KEY\` is configured in the production environment variables to activate dynamic, AI-driven architectural analysis.`;
}

export async function processProjectAI(projectId: string, force: boolean = false) {
    try {
        console.log(`[AI] Starting background AI generation for project ${projectId}`);
        const service = new ProjectService();
        const project = await service.getProjectById(projectId);
        
        // Se ha già la descrizione lunga e non stiamo forzando, skippa
        if ((project as any).descrizioneLunga && !force) {
             console.log(`[AI] Project ${projectId} already has a detailed description.`);
             return;
        }

        const generatedMarkdown = await generateDetailedDescription(project);
        
        // Update project with the new description
        await service.updateProject(projectId, { 
             descrizioneLunga: generatedMarkdown 
        });

        console.log(`[AI] Successfully generated and saved description for ${projectId}`);
        
        // Trigger vercel deploy to update the static page with the new AI description
        const { triggerVercelDeploy } = await import('./vercel');
        triggerVercelDeploy();

    } catch (error) {
        console.error(`[AI] Failed to process AI description for ${projectId}:`, error);
    }
}

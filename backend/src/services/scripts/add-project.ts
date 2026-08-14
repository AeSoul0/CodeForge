/**
 * backend/scripts/add-project.ts
 * * Architecture Layer: Operations / CLI Tooling
 * Responsibility: Provides a secure, interactive terminal interface
 * to seed projects into the database.
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });

const API_KEY: string | undefined = process.env.ADMIN_API_KEY;
const API_URL: string =
    process.env.PUBLIC_API_URL || 'http://localhost:3002';

if (!API_KEY) {
    console.error(
        '❌ ERROR: ADMIN_API_KEY not found in the environment variables.',
    );
    process.exit(1);
}

/**
 * Helper function to prompt the user and await their response.
 */
async function askQuestion(question: string): Promise<string> {
    return await rl.question(`\x1b[36m?\x1b[0m ${question} `);
}

/**
 * Interface representing the payload expected by the backend.
 */
interface ProjectPayload {
    titolo: string;
    descrizione: string;
    image: string;
    tecnologie: string[];
    categoria: string;
    linkGithub?: string;
}

async function main(): Promise<void> {
    console.log('\n=============================================');
    console.log('🚀 CodeForge Admin CLI - Add Project');
    console.log('=============================================\n');

    try {
        const title = await askQuestion('Project Title:');

        const description = await askQuestion(
            'Description (min 10 chars):',
        );

        const image = await askQuestion(
            'Image URL (e.g., https://...):',
        );

        const tagsInput = await askQuestion(
            'Technologies (comma-separated, e.g., React,Node,Astro):',
        );

        const category = await askQuestion(
            'Category (e.g., Embedded, AI, IoT, Full-Stack, Web):',
        );

        const link = await askQuestion(
            'GitHub or Live Link (leave empty if private):',
        );

        // Clean and format technologies.
        const tags: string[] = tagsInput
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag !== '');

        const normalizedCategory =
            category.trim() || 'Full-Stack';

        const normalizedLink =
            link.trim() !== '' ? link.trim() : undefined;

        const payload: ProjectPayload = {
            titolo: title.trim(),
            descrizione: description.trim(),
            image: image.trim(),
            tecnologie: tags,
            categoria: normalizedCategory,
            ...(normalizedLink
                ? { linkGithub: normalizedLink }
                : {}),
        };

        console.log('\n⏳ Sending payload to the database...');

        const response = await fetch(`${API_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();

            console.log(
                '\n✅ SUCCESS! Project added successfully.',
            );

            console.log(data);
        } else {
            let errorData: unknown;

            try {
                errorData = await response.json();
            } catch {
                errorData = await response.text();
            }

            console.error(
                '\n❌ SERVER ERROR:',
                response.status,
            );

            console.error(errorData);
        }
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : String(error);

        console.error(
            '\n❌ CONNECTION ERROR:',
            message,
        );

        console.log(
            'Make sure the backend server is running (npm run dev).',
        );
    } finally {
        rl.close();
    }
}

main();
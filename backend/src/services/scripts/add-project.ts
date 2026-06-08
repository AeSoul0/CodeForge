/**
 * backend/scripts/add-project.ts
 * * Architecture Layer: Operations / CLI Tooling
 * Responsibility: Provides a secure, interactive terminal interface to seed projects 
 * into the database. Automates the injection of the administrative API key.
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// We do not need to import dotenv here because we will use dotenvx to run the script!

const rl = readline.createInterface({ input, output });

// Ensure the API Key and Backend URL are available in the environment
const API_KEY: string | undefined = process.env.ADMIN_API_KEY;
const API_URL: string = process.env.PUBLIC_API_URL || 'http://localhost:3002';

if (!API_KEY) {
    console.error('❌ ERROR: ADMIN_API_KEY not found in the environment variables.');
    process.exit(1);
}

/**
 * Helper function to prompt the user and await their response.
 */
async function askQuestion(question: string): Promise<string> {
    return await rl.question(`\x1b[36m?\x1b[0m ${question} `);
}

/**
 * Interface representing the exact payload expected by the Fastify backend.
 */
interface ProjectPayload {
    titolo: string;
    descrizione: string;
    image: string;
    tecnologie: string[];
    linkGithub: string;
}

async function main(): Promise<void> {
    console.log('\n=============================================');
    console.log('🚀 CodeForge Admin CLI - Add Project');
    console.log('=============================================\n');

    try {
        const title = await askQuestion('Project Title:');
        const description = await askQuestion('Description (min 10 chars):');
        const image = await askQuestion('Image URL (e.g., https://...):');
        const tagsInput = await askQuestion('Technologies (comma-separated, e.g., React,Node,Astro):');
        const link = await askQuestion('GitHub or Live Link (e.g., https://...):');

        // Clean and format the tags array
        const tags: string[] = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        // Construct the strongly-typed payload
        const payload: ProjectPayload = {
            titolo: title,
            descrizione: description,
            image: image,
            tecnologie: tags,
            linkGithub: link
        };

        console.log('\n⏳ Sending payload to the database...');

        // Execute the authenticated POST request using the native Fetch API
        const response = await fetch(`${API_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY // 🔐 Secret injected automatically
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ SUCCESS! Project added successfully.');
            console.log(data);
        } else {
            const errorData = await response.json();
            console.error('\n❌ SERVER ERROR:', response.status);
            console.error(errorData);
        }

    } catch (error: any) {
        console.error('\n❌ CONNECTION ERROR:', error.message);
        console.log('Make sure the backend server is running (npm run dev).');
    } finally {
        rl.close();
    }
}

// Execute the CLI
main();
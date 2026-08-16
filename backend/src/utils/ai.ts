/**
 * @file backend/src/utils/ai.ts
 * @description Background service for generating automated project documentation
 * utilizing Large Language Models (LLMs) such as OpenAI GPT or Google Gemini.
 * It enriches project records with technical deep-dives automatically.
 */

import { ProjectService } from '../services/ProjectService';

// Fallback to a placeholder if no API keys are provided.
export async function generateDetailedDescription(project: any): Promise<string> {
    const prompt = `
You are an expert technical writer. Write a detailed, engaging, and professional deep dive (about 300 words) for the following tech project:
Title: ${project.titolo}
Short Description: ${project.descrizione}
Technologies: ${project.tecnologie.join(', ')}

Explain the potential architecture, the problems it solves, and the impact of the technologies used. Use markdown formatting. Do not include a title.
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
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });
            const data = await response.json();
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
                    contents: [{ parts: [{ text: prompt }] }]
                })
             });
             const data = await response.json();
             if (data.candidates && data.candidates.length > 0) {
                 return data.candidates[0].content.parts[0].text;
             }
         } catch (error) {
             console.error('[AI] Gemini fetch failed:', error);
         }
    }

    // Default Fallback
    return `### Introduction\nThis project, **${project.titolo}**, is an incredible piece of engineering built with ${project.tecnologie.join(', ')}.\n\n### Architecture & Deep Dive\nBased on the technologies utilized, this application demonstrates a modern, scalable approach to solving complex problems. The architecture is designed to handle demanding workloads efficiently. \n\n*(Note: Configure OPENAI_API_KEY or GEMINI_API_KEY in the backend .env to auto-generate real AI descriptions!)*`;
}

export async function processProjectAI(projectId: string) {
    try {
        console.log(`[AI] Starting background AI generation for project ${projectId}`);
        const service = new ProjectService();
        const project = await service.getProjectById(projectId);
        
        // Se ha già la descrizione lunga, skippa
        if ((project as any).descrizioneLunga) {
             console.log(`[AI] Project ${projectId} already has a detailed description.`);
             return;
        }

        const generatedMarkdown = await generateDetailedDescription(project);
        
        // Update project with the new description
        await service.updateProject(projectId, { 
             ...project,
             descrizioneLunga: generatedMarkdown 
        } as any);

        console.log(`[AI] Successfully generated and saved description for ${projectId}`);
        
        // Trigger vercel deploy to update the static page with the new AI description
        const { triggerVercelDeploy } = await import('./vercel');
        triggerVercelDeploy();

    } catch (error) {
        console.error(`[AI] Failed to process AI description for ${projectId}:`, error);
    }
}

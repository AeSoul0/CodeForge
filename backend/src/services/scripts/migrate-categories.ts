/**
 * @file backend/src/services/scripts/migrate-categories.ts
 * @description CLI migration script to assign macro-domain categories to existing database projects.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Project from '../../models/Projects';

async function runMigration() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeforge';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB. Starting category migration...');

        const projects = await Project.find();

        for (const p of projects) {
            let assignedCategory = 'Full-Stack'; // Default fallback
            const techs = p.tecnologie.map((t: string) => t.toLowerCase());

            // Heuristic domain mapping based on technology stack keywords
            if (techs.includes('c++') || techs.includes('freertos') || techs.includes('arduino')) {
                assignedCategory = 'Embedded';
            } else if (techs.includes('python') || techs.includes('ai') || techs.includes('ollama') || techs.includes('nlp')) {
                assignedCategory = 'AI';
            } else if (techs.includes('iot')) {
                assignedCategory = 'IoT';
            }

            p.categoria = assignedCategory;
            await p.save();
            console.log(`[UPDATED] "${p.titolo}" -> Category: ${assignedCategory}`);
        }

        console.log('🎉 Category migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
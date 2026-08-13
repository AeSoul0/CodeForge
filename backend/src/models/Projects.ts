/**
 * @file backend/src/models/Projects.ts
 * @description Mongoose schema and model definition for the Projects collection.
 */

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
    {
        titolo: { type: String, required: true },
        descrizione: { type: String, required: true },
        tecnologie: [{ type: String, required: true }],
        // Macro-domain category classification
        categoria: {
            type: String,
            required: true,
            enum: ['Full-Stack', 'Embedded', 'AI', 'IoT', 'Data'],
            default: 'Full-Stack'
        },
        linkGithub: { type: String, required: false }
    },
    {
        // Automatically manages createdAt and updatedAt timestamps
        timestamps: true
    }
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
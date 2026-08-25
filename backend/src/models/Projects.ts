/**
 * @file backend/src/models/Projects.ts
 * @description Mongoose database schema definitions.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
    titolo: string;
    role?: string;
    descrizione: string;
    descrizioneLunga?: string;
    tecnologie: string[];
    categoria?: string;
    categorie: string[];
    linkGithub?: string;
    image?: string;
    experienceId?: mongoose.Types.ObjectId;
}

const ProjectSchema: Schema = new Schema(
    {
        titolo: {
            type: String,
            required: true,
        },
        role: {
            type: String,
        },
        descrizione: {
            type: String,
            required: true,
        },
        descrizioneLunga: {
            type: String,
        },
        tecnologie: [
            {
                type: String,
                required: true,
            },
        ],
        categoria: {
            type: String,
        },
        categorie: [
            {
                type: String,
            },
        ],
        linkGithub: {
            type: String,
        },
        image: {
            type: String,
        },
        experienceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Experience'
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ categorie: 1 });
ProjectSchema.index({ experienceId: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
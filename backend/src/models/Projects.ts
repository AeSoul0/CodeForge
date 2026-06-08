/**
 * backend/src/models/Projects.ts
 * * Architecture Layer: Data Model
 * Responsibility: Defines the schema and TypeScript interface for the Project entity.
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript Interface defining the structure of a Project document.
 * Inherits from Mongoose's Document to include default DB properties like _id.
 */
export interface IProject extends Document {
    titolo: string;
    descrizione: string;
    image?: string;
    tecnologie: string[];
    linkGithub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the precise Mongoose Schema implementing the interface
const ProjectSchema: Schema = new Schema(
    {
        titolo: {
            type: String,
            required: true
        },
        descrizione: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: false
        },
        tecnologie: {
            type: [String],
            required: true
        },
        linkGithub: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true // Automatically manages createdAt and updatedAt fields
    }
);

// Export the strictly-typed Model
export default mongoose.model<IProject>('Project', ProjectSchema);
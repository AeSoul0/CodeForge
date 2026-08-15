/**
 * @file backend/src/models/Projects.ts
 * @description Mongoose schema and model definition for the Projects collection.
 *
 * Projects can belong to multiple macro-domains.
 *
 * Example:
 *   categorie: ["Full-Stack", "AI"]
 */

import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        titolo: {
            type: String,
            required: true,
        },

        descrizione: {
            type: String,
            required: true,
        },

        tecnologie: [
            {
                type: String,
                required: true,
            },
        ],

        /*
         * A project can belong to multiple macro-domain categories.
         *
         * Examples:
         *   ["Full-Stack"]
         *   ["Full-Stack", "AI"]
         *   ["Full-Stack", "IoT"]
         *   ["Full-Stack", "Embedded"]
         */
        categorie: {
            type: [
                {
                    type: String,
                    enum: [
                        "Full-Stack",
                        "Embedded",
                        "AI",
                        "IoT",
                        "Data",
                    ],
                },
            ],
            required: true,
            default: ["Full-Stack"],
        },

        linkGithub: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    },
);

export default
    mongoose.models.Project ||
    mongoose.model("Project", projectSchema);
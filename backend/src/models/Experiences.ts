/**
 * @file backend/src/models/Experiences.ts
 * @description Mongoose schema and model definition for the Experiences collection.
 *
 * Experience records represent professional and academic activities displayed
 * in the public portfolio. Dates are stored as native MongoDB Date values
 * to support reliable chronological sorting.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for experience records.
 */
const experienceSchema = new mongoose.Schema(
    {
        /**
         * Job title, academic role, or position name.
         */
        role: {
            type: String,
            required: true,
            trim: true,
        },

        /**
         * Company, university, organization, or institution name.
         */
        company: {
            type: String,
            required: true,
            trim: true,
        },

        /**
         * Human-readable description of the experience.
         */
        description: {
            type: String,
            required: true,
            trim: true,
        },

        /**
         * Technologies, frameworks, languages, tools, or technical
         * concepts associated with the experience.
         */
        technologies: {
            type: [String],
            required: true,
            default: [],
        },

        /**
         * Start date of the experience.
         *
         * This field is used as the primary chronological sorting key.
         */
        startDate: {
            type: Date,
            required: true,
        },

        /**
         * End date of the experience.
         *
         * A null value is used for ongoing experiences.
         */
        endDate: {
            type: Date,
            required: false,
            default: null,
        },

        /**
         * Indicates whether the experience is currently active.
         */
        current: {
            type: Boolean,
            required: true,
            default: false,
        },

        /**
         * Optional image or logo associated with the experience.
         *
         * The value may contain a local public path or an externally
         * hosted image URL.
         */
        image: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },
    },
    {
        /**
         * Automatically maintain createdAt and updatedAt timestamps.
         */
        timestamps: true,
    },
);

/**
 * Index used to optimize chronological experience queries.
 *
 * The API retrieves experiences from newest to oldest.
 */
experienceSchema.index({ startDate: -1 });

/**
 * Reuse the compiled model when available.
 *
 * This prevents Mongoose model overwrite errors during development
 * and hot module reloads.
 */
export default mongoose.models.Experience ||
    mongoose.model('Experience', experienceSchema);
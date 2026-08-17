/**
 * @file backend/src/models/Experiences.ts
 * @description Mongoose schema and model definition for the Experiences collection.
 *
 * Experience records represent professional and academic activities displayed
 * in the public portfolio.
 */

import mongoose from "mongoose";

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
         * Public URL used by the frontend to retrieve the image.
         *
         * Example:
         * /api/experiences/<id>/image
         */
        image: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },

        /**
         * Binary image payload stored directly in MongoDB.
         *
         * This is intentionally separate from `image` so the normal
         * experience JSON payload does not contain the binary data.
         */
        imageData: {
            type: Buffer,
            required: false,
            default: null,
        },

        /**
         * MIME type used when returning the stored image.
         *
         * Example:
         * image/jpeg
         * image/png
         * image/webp
         */
        imageMimeType: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },

        /**
         * Original image filename, when available.
         */
        imageFileName: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

/**
 * Index used to optimize chronological experience queries.
 */
experienceSchema.index({ startDate: -1 });

/**
 * Reuse the compiled model when available.
 */
export default mongoose.models.Experience ||
    mongoose.model("Experience", experienceSchema);
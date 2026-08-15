/**
 * @file backend/src/services/scripts/migrate-categories.ts
 * @description Automatically assigns one or more macro-domain
 * categories to projects by analyzing their technology stack.
 *
 * Categories:
 *   - Full-Stack
 *   - Embedded
 *   - AI
 *   - IoT
 *
 * Multiple categories are allowed.
 *
 * AI detection intentionally avoids generic substring matching
 * for short tags such as "ai" and "ml", preventing false positives
 * such as "Tailwind".
 */

import "dotenv/config";
import mongoose from "mongoose";
import Project from "../../../models/Projects";

/* ==========================================================
   HELPERS
   ========================================================== */

/**
 * Normalizes technology names before classification.
 */
function normalizeTechnology(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

/**
 * Checks whether a technology contains one of the given
 * multi-character keywords.
 *
 * Example:
 *   "Ollama" -> matches "ollama"
 *   "PostgreSQL" -> matches "postgresql"
 */
function containsAny(
    technologies: string[],
    keywords: string[],
): boolean {
    return technologies.some((technology) =>
        keywords.some((keyword) =>
            technology.includes(keyword),
        ),
    );
}

/**
 * Checks for exact technology/tag matches.
 *
 * This is important for short values such as:
 *   "ai"
 *   "ml"
 *
 * Otherwise "Tailwind" would incorrectly match "ai".
 */
function hasExact(
    technologies: string[],
    values: string[],
): boolean {
    return technologies.some((technology) =>
        values.includes(technology),
    );
}

/* ==========================================================
   FRONTEND TECHNOLOGIES
   ========================================================== */

const FRONTEND_KEYWORDS = [
    "html",
    "css",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "nextjs",
    "vue",
    "nuxt",
    "angular",
    "svelte",
    "astro",
    "solid",
    "tailwind",
    "tailwindcss",
];

/* ==========================================================
   BACKEND TECHNOLOGIES
   ========================================================== */

const BACKEND_KEYWORDS = [
    "node.js",
    "nodejs",
    "express",
    "express.js",
    "nestjs",
    "nest.js",
    "fastify",
    "fastapi",
    "django",
    "flask",
    "spring boot",
    "spring",
    "asp.net",
    ".net",
    "laravel",
    "php",
    "ruby on rails",
    "rails",
    "golang",
    "rust",
    "java",
];

/* ==========================================================
   DATABASE TECHNOLOGIES
   ========================================================== */

const DATABASE_KEYWORDS = [
    "sql",
    "mysql",
    "postgres",
    "postgresql",
    "mongodb",
    "mongo",
    "redis",
    "sqlite",
    "mariadb",
    "firebase",
    "supabase",
    "oracle",
];

/* ==========================================================
   EMBEDDED TECHNOLOGIES
   ========================================================== */

const EMBEDDED_KEYWORDS = [
    "c++",
    "c/c++",
    "arduino",
    "arduino ide",
    "freertos",
    "esp32",
    "esp8266",
    "stm32",
    "stm8",
    "raspberry pi",
    "platformio",
    "embedded",
    "firmware",
    "microcontroller",
    "micro-controller",
    "avr",
    "pic",
    "microchip",
    "arm cortex",
    "zephyr",
    "mbed",
];

/* ==========================================================
   AI TECHNOLOGIES
   ========================================================== */

/**
 * Long/specific AI technologies can safely use substring matching.
 */
const AI_KEYWORDS = [
    "ollama",
    "openai",
    "chatgpt",
    "gpt-4",
    "gpt-4o",
    "gpt-3.5",
    "llm",
    "nlp",
    "langchain",
    "langgraph",
    "tensorflow",
    "pytorch",
    "transformers",
    "huggingface",
    "scikit-learn",
    "sklearn",
    "machine learning",
    "machine-learning",
    "deep learning",
    "deep-learning",
    "neural network",
    "neural-network",
    "computer vision",
    "opencv",
    "retrieval augmented generation",
    "generative ai",
    "genai",
    "artificial intelligence",
    "artificial-intelligence",
];

/**
 * Short AI tags must be exact matches.
 *
 * IMPORTANT:
 * "ai" is NOT searched with includes().
 * Otherwise "Tailwind" would be detected as AI.
 */
const AI_EXACT_TAGS = [
    "ai",
    "ml",
];

/* ==========================================================
   IOT TECHNOLOGIES
   ========================================================== */

const IOT_KEYWORDS = [
    "iot",
    "mqtt",
    "coap",
    "zigbee",
    "lorawan",
    "modbus",
    "bluetooth low energy",
    "bluetooth le",
    "ble",
    "home assistant",
    "thingsboard",
    "thingspeak",
    "aws iot",
    "azure iot",
];

/* ==========================================================
   CLASSIFICATION FUNCTIONS
   ========================================================== */

function detectFrontend(
    technologies: string[],
): boolean {
    return containsAny(
        technologies,
        FRONTEND_KEYWORDS,
    );
}

function detectBackend(
    technologies: string[],
): boolean {
    return containsAny(
        technologies,
        BACKEND_KEYWORDS,
    );
}

function detectDatabase(
    technologies: string[],
): boolean {
    return containsAny(
        technologies,
        DATABASE_KEYWORDS,
    );
}

function detectEmbedded(
    technologies: string[],
): boolean {
    return containsAny(
        technologies,
        EMBEDDED_KEYWORDS,
    );
}

function detectAI(
    technologies: string[],
): boolean {
    return (
        containsAny(
            technologies,
            AI_KEYWORDS,
        ) ||
        hasExact(
            technologies,
            AI_EXACT_TAGS,
        )
    );
}

function detectIoT(
    technologies: string[],
): boolean {
    return containsAny(
        technologies,
        IOT_KEYWORDS,
    );
}

/**
 * Full Stack requires at least two real application layers.
 *
 * Valid:
 *   Frontend + Backend
 *   Backend + Database
 */
function detectFullStack(
    hasFrontend: boolean,
    hasBackend: boolean,
    hasDatabase: boolean,
): boolean {
    return (
        (hasFrontend && hasBackend) ||
        (hasBackend && hasDatabase)
    );
}

/* ==========================================================
   MIGRATION
   ========================================================== */

async function runMigration(): Promise<void> {
    try {
        const uri =
            process.env.MONGODB_URI ||
            "mongodb://127.0.0.1:27017/codeforge";

        await mongoose.connect(uri);

        console.log(
            "✅ Connected to MongoDB. Starting category migration...",
        );

        const projects = await Project.find();

        console.log(
            `📦 Found ${projects.length} projects.`,
        );

        for (const project of projects) {
            const technologies =
                (project.tecnologie ?? []).map(
                    (technology: string) =>
                        normalizeTechnology(
                            String(technology),
                        ),
                );

            const hasFrontend =
                detectFrontend(
                    technologies,
                );

            const hasBackend =
                detectBackend(
                    technologies,
                );

            const hasDatabase =
                detectDatabase(
                    technologies,
                );

            const isEmbedded =
                detectEmbedded(
                    technologies,
                );

            const isAI =
                detectAI(
                    technologies,
                );

            const isIoT =
                detectIoT(
                    technologies,
                );

            const isFullStack =
                detectFullStack(
                    hasFrontend,
                    hasBackend,
                    hasDatabase,
                );

            const categories =
                new Set<string>();

            /* ==================================================
               EMBEDDED
               ================================================== */

            if (isEmbedded) {
                categories.add(
                    "Embedded",
                );
            }

            /* ==================================================
               AI
               ================================================== */

            if (isAI) {
                categories.add("AI");
            }

            /* ==================================================
               IOT
               ================================================== */

            if (isIoT) {
                categories.add("IoT");
            }

            /* ==================================================
               FULL STACK
               ================================================== */

            if (isFullStack) {
                categories.add(
                    "Full-Stack",
                );
            }

            /* ==================================================
               SAVE
               ================================================== */

            const assignedCategories =
                [...categories];

            project.categorie =
                assignedCategories;

            await project.save();

            console.log(
                `[UPDATED] "${project.titolo}"`,
            );

            console.log(
                `  Technologies: ${technologies.join(
                    ", ",
                ) || "none"
                }`,
            );

            console.log(
                `  Layers: frontend=${hasFrontend}, backend=${hasBackend}, database=${hasDatabase}`,
            );

            console.log(
                `  Categories: ${assignedCategories.length > 0
                    ? assignedCategories.join(
                        ", ",
                    )
                    : "none"
                }`,
            );

            console.log("");
        }

        console.log(
            "🎉 Category migration completed successfully!",
        );

        await mongoose.disconnect();

        console.log(
            "✅ MongoDB connection closed.",
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "❌ Migration failed:",
            error,
        );

        try {
            await mongoose.disconnect();
        } catch {
            // Ignore disconnect errors after migration failure.
        }

        process.exit(1);
    }
}

runMigration();
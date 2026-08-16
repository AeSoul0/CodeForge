/**
 * @file backend/src/config/env.ts
 * @description Centralized environment configuration for the backend.
 *
 * Environment loading rules:
 *
 * - test:
 *   .env.test is provided by the test runner.
 *   .env is never loaded.
 *
 * - development:
 *   .env is loaded.
 *
 * - production:
 *   Existing process environment variables are preserved.
 *   .env is used as a local fallback when available.
 *
 * This module must be imported before application code that reads
 * environment variables.
 */

import dotenv from 'dotenv';

/**
 * Detect whether the application is running inside Vitest.
 *
 * Vitest exposes the VITEST environment variable. We only need to
 * check that the variable exists because its exact value can vary
 * between runners and versions.
 */
const isVitest = Boolean(process.env.VITEST);

/**
 * Treat the process as a test environment when either NODE_ENV=test
 * or Vitest is running.
 */
const isTestEnvironment =
    process.env.NODE_ENV?.trim() === 'test' ||
    isVitest;

/**
 * Normalize the current runtime environment.
 */
const nodeEnv = isTestEnvironment
    ? 'test'
    : process.env.NODE_ENV?.trim() || 'development';

/**
 * Load .env only outside the test environment.
 *
 * Tests receive their variables exclusively from .env.test.
 * This prevents development credentials from being loaded accidentally.
 */
if (!isTestEnvironment) {
    dotenv.config({
        path: '.env',
    });
}

/**
 * Export the current runtime environment so that other modules
 * can use a single normalized value.
 */
export const environment = nodeEnv;

/**
 * Export commonly used environment variables.
 *
 * Keeping environment access centralized prevents individual modules
 * from loading dotenv files independently.
 */
export const env = {
    nodeEnv: environment,

    mongodbUri: process.env.MONGODB_URI?.trim(),

    port: Number(process.env.PORT ?? 3000),

    host: process.env.HOST?.trim() || '0.0.0.0',

    jwtSecret: process.env.JWT_SECRET?.trim(),

    cookieSecret: process.env.COOKIE_SECRET?.trim(),
} as const;

/**
 * @file backend/tests/setup.ts
 * @description Shared MongoDB lifecycle for the backend test suite.
 */

import mongoose from 'mongoose';
import {
    afterAll,
    beforeAll,
} from 'vitest';

const mongoUri = process.env.MONGODB_URI?.trim();

if (!mongoUri) {
    throw new Error(
        'MONGODB_URI is required to run the backend tests. ' +
        'Define MONGODB_URI in .env.test.',
    );
}

/**
 * Establish a connection to the dedicated MongoDB test database
 * before any test suite starts.
 */
beforeAll(async () => {
    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    });
});

/**
 * Remove test data and close the MongoDB connection after the
 * entire test suite has completed.
 */
afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});

/**
 * backend/src/config/db.ts
 * * Architecture Layer: Infrastructure / Data Access
 * Responsibility: Manages the lifecycle of the MongoDB connection.
 */

import mongoose from 'mongoose';

/**
 * Establishes an asynchronous connection to the MongoDB cluster.
 * Halts the Node process if the connection fails to prevent app instability.
 */
const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MONGODB_URI is strictly required but missing from environment variables.');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Cluster Connected Successfully');
    } catch (error) {
        console.error('❌ Fatal MongoDB Connection Error:', error);
        process.exit(1);
    }
};

export default connectDB;
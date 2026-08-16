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
const connectDB = async (retries = 5, delay = 5000): Promise<void> => {
    while (retries > 0) {
        try {
            const mongoURI = process.env.MONGODB_URI;

            if (!mongoURI) {
                throw new Error('MONGODB_URI is strictly required but missing from environment variables.');
            }

            await mongoose.connect(mongoURI, {
                serverSelectionTimeoutMS: 5000,
            });
            
            console.log('✅ MongoDB Cluster Connected Successfully');
            
            // Handle post-connection events for resilience
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB runtime error:', err);
            });
            
            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected.');
            });

            return;
        } catch (error) {
            console.error(`❌ MongoDB Connection Error. Retries left: ${retries - 1}`, error);
            retries -= 1;
            if (retries === 0) {
                console.error('❌ Fatal MongoDB Connection Error: Max retries reached. Exiting.');
                process.exit(1);
            }
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};

export default connectDB;
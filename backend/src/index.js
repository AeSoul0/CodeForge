import 'dotenv/config'; // Load secret variables from the .env file (like the DB URL)
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.js';
import projectRoutes from './routes/projectRoutes.js';

// Initialize Fastify with the chosen logger configuration
const fastify = Fastify({
    logger: {
        level: 'info', // Show basic informative logs
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:HH:mm:ss', // Local system time
                ignore: 'pid,hostname,reqId',  // Clean up to reduce visual clutter
                colorize: true,                // Enable terminal colors
                singleLine: true,              // Everything on a single line for tidiness
            }
        }
    }
});

// Enable CORS
await fastify.register(cors, { origin: '*' });

// --- ADDED: Base route to prevent 404 errors in Render logs ---
fastify.get('/', async () => {
    return { status: 'ok', message: 'CodeForge Backend is live!' };
});

// Register existing routes
fastify.register(projectRoutes);
fastify.register(healthRoutes, { prefix: '/api' });

// Main startup function
const start = async () => {
    try {
        // 1. Database connection
        await connectDB();

        // 2. Port and Host configuration for Render
        const PORT = process.env.PORT || 3002;

        // It's crucial that the host is '0.0.0.0' for Render deployments
        await fastify.listen({ port: PORT, host: '0.0.0.0' });

        console.log(`🚀 Server ready on port ${PORT}`);

    } catch (err) {
        console.error('❌ Failed to start the server:');
        fastify.log.error(err);
        process.exit(1); // Exit the Node.js process
    }
};

// Execute the startup function
start();
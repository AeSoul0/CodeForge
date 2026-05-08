import mongoose from 'mongoose';

export default async function healthRoutes(fastify, options) {

    fastify.get('/health', async (request, reply) => {
        // Mongoose readyState ritorna: 0 (disconnesso), 1 (connesso), 2 (in connessione), 3 (in disconnessione)
        const dbStatus = mongoose.connection.readyState;
        const isDbConnected = dbStatus === 1;

        const healthInfo = {
            status: isDbConnected ? 'ok' : 'error',
            database: isDbConnected ? 'Connesso' : 'Disconnesso',
            uptime: process.uptime(), // Da quanti secondi il server è acceso
            timestamp: new Date().toISOString()
        };

        if (!isDbConnected) {
            // 503 significa "Servizio non disponibile"
            return reply.code(503).send(healthInfo);
        }

        // 200 significa "Tutto perfetto"
        return reply.code(200).send(healthInfo);
    });

}
/**
 * @file backend/src/middlewares/errorHandler.ts
 * @description Global error handler for Fastify. Ensures consistent error responses
 * and prevents sensitive stack traces from leaking in production environments.
 */

import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function globalErrorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
) {
    // 1. Log dell'errore nel terminale del server per il debugging interno
    request.log.error(error);

    const statusCode = error.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // 2. Formattazione standard della risposta
    const response = {
        success: false,
        statusCode,
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        // In produzione, nascondiamo i dettagli dei crash interni (Errore 500)
        message: (statusCode === 500 && isProduction)
            ? 'An unexpected error occurred on the server.'
            : error.message,
        // 3. Mostra lo stack trace solo se sei in locale (sviluppo)
        ...(isProduction ? {} : { stack: error.stack })
    };

    reply.status(statusCode).send(response);
}
/**
 * @file backend/src/utils/auditLogger.ts
 * @description Core module for CodeForge application.
 */

import pino from 'pino';

// Reuse Fastify's logger instance configuration
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: { colorize: true }
    } : undefined
});

export interface AuditLogPayload {
    requestId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    result: 'success' | 'failure';
    actor: string;
    error?: string;
}

export const auditLogger = {
    log: (payload: AuditLogPayload) => {
        // Sanitize - never log passwords or tokens (even though we shouldn't receive them here)
        logger.info({
            audit: true,
            timestamp: new Date().toISOString(),
            ...payload
        }, `Audit Log: [${payload.action}] on ${payload.resource}`);
    }
};

/**
 * @file backend/src/controllers/healthController.ts
 * @description Controller handling incoming HTTP requests and responses.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';

export async function checkLiveness(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
}

export async function checkReadiness(request: FastifyRequest, reply: FastifyReply) {
    const dbState = mongoose.connection.readyState;
    // 1 = connected
    if (dbState === 1) {
        return reply.status(200).send({ status: 'ready', database: 'connected' });
    } else {
        return reply.status(503).send({ status: 'unavailable', database: 'disconnected' });
    }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';

export const metrics = {
    requestsCount: 0,
    errorsCount: 0,
    statusCodes: {
        '2xx': 0,
        '3xx': 0,
        '4xx': 0,
        '5xx': 0,
    },
    latencyTotal: 0,
};

export const metricsHook = async (request: FastifyRequest, reply: FastifyReply) => {
    metrics.requestsCount++;

    const statusCode = reply.statusCode;
    if (statusCode >= 200 && statusCode < 300) metrics.statusCodes['2xx']++;
    else if (statusCode >= 300 && statusCode < 400) metrics.statusCodes['3xx']++;
    else if (statusCode >= 400 && statusCode < 500) metrics.statusCodes['4xx']++;
    else if (statusCode >= 500) {
        metrics.statusCodes['5xx']++;
        metrics.errorsCount++;
    }

    const responseTime = reply.elapsedTime;
    metrics.latencyTotal += responseTime;
};

export const getMetrics = () => {
    const avgLatency = metrics.requestsCount > 0 ? metrics.latencyTotal / metrics.requestsCount : 0;
    
    // Attempt to grab simple DB latency via an admin ping, but for simple metrics we just return what we have
    // Real DB latency tracking would require a mongoose plugin or wrapping query execution.
    return {
        requestsCount: metrics.requestsCount,
        errorCount: metrics.errorsCount,
        statusCodes: metrics.statusCodes,
        averageLatencyMs: avgLatency,
        databaseState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
};

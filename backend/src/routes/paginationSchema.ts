/**
 * @file backend/src/routes/paginationSchema.ts
 * @description Shared querystring validation for paginated collections.
 *
 * Fastify's default Ajv instance coerces querystring values, so `?page=2`
 * reaches the controller as a number. Bounds stop unbounded scans.
 */

export const paginationQuerySchema = {
    querystring: {
        type: 'object',
        properties: {
            page: {
                type: 'integer',
                minimum: 1,
                maximum: 10000,
                default: 1,
            },
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10,
            },
        },
    },
} as const;

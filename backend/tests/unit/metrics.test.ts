import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const {
    mongooseConnection,
} = vi.hoisted(() => ({
    mongooseConnection: {
        readyState: 1,
    },
}));

vi.mock(
    'mongoose',
    () => ({
        default: {
            connection:
                mongooseConnection,
        },
    }),
);

import {
    getMetrics,
    metrics,
    metricsHook,
} from '../../src/middlewares/metrics';

describe(
    'metrics',
    () => {
        beforeEach(() => {
            metrics.requestsCount =
                0;

            metrics.errorsCount =
                0;

            metrics.statusCodes[
                '2xx'
            ] = 0;

            metrics.statusCodes[
                '3xx'
            ] = 0;

            metrics.statusCodes[
                '4xx'
            ] = 0;

            metrics.statusCodes[
                '5xx'
            ] = 0;

            metrics.latencyTotal =
                0;

            mongooseConnection.readyState =
                1;
        });

        it(
            'tracks 2xx requests',
            async () => {
                const request = {} as never;

                const reply = {
                    statusCode:
                        200,

                    elapsedTime:
                        25,
                } as never;

                await metricsHook(
                    request,
                    reply,
                );

                expect(
                    metrics.requestsCount,
                ).toBe(1);

                expect(
                    metrics.statusCodes[
                        '2xx'
                    ],
                ).toBe(1);

                expect(
                    metrics.errorsCount,
                ).toBe(0);

                expect(
                    metrics.latencyTotal,
                ).toBe(25);
            },
        );

        it(
            'tracks 3xx requests',
            async () => {
                await metricsHook(
                    {} as never,
                    {
                        statusCode:
                            302,

                        elapsedTime:
                            5,
                    } as never,
                );

                expect(
                    metrics.statusCodes[
                        '3xx'
                    ],
                ).toBe(1);

                expect(
                    metrics.errorsCount,
                ).toBe(0);
            },
        );

        it(
            'tracks 4xx requests',
            async () => {
                await metricsHook(
                    {} as never,
                    {
                        statusCode:
                            404,

                        elapsedTime:
                            10,
                    } as never,
                );

                expect(
                    metrics.statusCodes[
                        '4xx'
                    ],
                ).toBe(1);

                expect(
                    metrics.errorsCount,
                ).toBe(0);
            },
        );

        it(
            'tracks 5xx requests and errors',
            async () => {
                await metricsHook(
                    {} as never,
                    {
                        statusCode:
                            500,

                        elapsedTime:
                            50,
                    } as never,
                );

                expect(
                    metrics.statusCodes[
                        '5xx'
                    ],
                ).toBe(1);

                expect(
                    metrics.errorsCount,
                ).toBe(1);

                expect(
                    metrics.latencyTotal,
                ).toBe(50);
            },
        );

        it(
            'calculates average latency',
            async () => {
                await metricsHook(
                    {} as never,
                    {
                        statusCode:
                            200,
                        elapsedTime:
                            20,
                    } as never,
                );

                await metricsHook(
                    {} as never,
                    {
                        statusCode:
                            200,
                        elapsedTime:
                            40,
                    } as never,
                );

                const result =
                    getMetrics();

                expect(
                    result.requestsCount,
                ).toBe(2);

                expect(
                    result.averageLatencyMs,
                ).toBe(30);

                expect(
                    result.databaseState,
                ).toBe(
                    'connected',
                );
            },
        );

        it(
            'reports disconnected database state',
            () => {
                mongooseConnection.readyState =
                    0;

                const result =
                    getMetrics();

                expect(
                    result.databaseState,
                ).toBe(
                    'disconnected',
                );
            },
        );

        it(
            'returns zero average latency with no requests',
            () => {
                const result =
                    getMetrics();

                expect(
                    result.averageLatencyMs,
                ).toBe(0);
            },
        );
    },
);
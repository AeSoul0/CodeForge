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
    checkLiveness,
    checkReadiness,
} from '../../src/controllers/healthController';

function createReply() {
    return {
        status:
            vi.fn()
                .mockReturnThis(),

        send:
            vi.fn()
                .mockReturnThis(),
    };
}

describe(
    'healthController',
    () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mongooseConnection.readyState =
                1;
        });

        it(
            'returns healthy liveness response',
            async () => {
                const reply =
                    createReply();

                await checkLiveness(
                    {} as never,
                    reply as never,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status:
                            'ok',
                    }),
                );
            },
        );

        it(
            'returns ready when MongoDB is connected',
            async () => {
                mongooseConnection.readyState =
                    1;

                const reply =
                    createReply();

                await checkReadiness(
                    {} as never,
                    reply as never,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    200,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    status:
                        'ready',

                    database:
                        'connected',
                });
            },
        );

        it(
            'returns unavailable when MongoDB is disconnected',
            async () => {
                mongooseConnection.readyState =
                    0;

                const reply =
                    createReply();

                await checkReadiness(
                    {} as never,
                    reply as never,
                );

                expect(
                    reply.status,
                ).toHaveBeenCalledWith(
                    503,
                );

                expect(
                    reply.send,
                ).toHaveBeenCalledWith({
                    status:
                        'unavailable',

                    database:
                        'disconnected',
                });
            },
        );
    },
);
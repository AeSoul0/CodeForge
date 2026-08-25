import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    triggerVercelDeploy,
} from '../../src/utils/vercel';

describe(
    'triggerVercelDeploy',
    () => {
        const originalUrl =
            process.env
                .VERCEL_DEPLOY_HOOK_URL;

        const originalWarn =
            console.warn;

        const originalLog =
            console.log;

        const originalError =
            console.error;

        beforeEach(() => {
            vi.restoreAllMocks();
        });

        afterEach(() => {
            process.env
                .VERCEL_DEPLOY_HOOK_URL =
                originalUrl;

            console.warn =
                originalWarn;

            console.log =
                originalLog;

            console.error =
                originalError;

            vi.restoreAllMocks();
        });

        it(
            'skips deployment when hook URL is missing',
            async () => {
                delete process.env
                    .VERCEL_DEPLOY_HOOK_URL;

                const warn =
                    vi.spyOn(
                        console,
                        'warn',
                    ).mockImplementation(
                        () =>
                            undefined,
                    );

                const fetchMock =
                    vi.spyOn(
                        globalThis,
                        'fetch',
                    );

                await triggerVercelDeploy();

                expect(
                    warn,
                ).toHaveBeenCalledWith(
                    '[Vercel] No VERCEL_DEPLOY_HOOK_URL configured. Skipping static redeploy.',
                );

                expect(
                    fetchMock,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            'triggers deployment when hook returns success',
            async () => {
                process.env
                    .VERCEL_DEPLOY_HOOK_URL =
                    'https://vercel.example/hook';

                const log =
                    vi.spyOn(
                        console,
                        'log',
                    ).mockImplementation(
                        () =>
                            undefined,
                    );

                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockResolvedValue(
                    new Response(
                        null,
                        {
                            status: 200,
                        },
                    ),
                );

                await triggerVercelDeploy();

                expect(
                    log,
                ).toHaveBeenCalledWith(
                    '[Vercel] Triggering deployment webhook...',
                );

                expect(
                    log,
                ).toHaveBeenCalledWith(
                    '[Vercel] Deployment successfully triggered.',
                );
            },
        );

        it(
            'logs non-successful deployment status',
            async () => {
                process.env
                    .VERCEL_DEPLOY_HOOK_URL =
                    'https://vercel.example/hook';

                const error =
                    vi.spyOn(
                        console,
                        'error',
                    ).mockImplementation(
                        () =>
                            undefined,
                    );

                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockResolvedValue(
                    new Response(
                        null,
                        {
                            status: 500,
                        },
                    ),
                );

                await triggerVercelDeploy();

                expect(
                    error,
                ).toHaveBeenCalledWith(
                    '[Vercel] Failed to trigger deployment. Status: 500',
                );
            },
        );

        it(
            'logs network errors',
            async () => {
                process.env
                    .VERCEL_DEPLOY_HOOK_URL =
                    'https://vercel.example/hook';

                const error =
                    vi.spyOn(
                        console,
                        'error',
                    ).mockImplementation(
                        () =>
                            undefined,
                    );

                vi.spyOn(
                    globalThis,
                    'fetch',
                ).mockRejectedValue(
                    new Error(
                        'network failure',
                    ),
                );

                await triggerVercelDeploy();

                expect(
                    error,
                ).toHaveBeenCalledWith(
                    '[Vercel] Error triggering deployment:',
                    expect.any(
                        Error,
                    ),
                );
            },
        );
    },
);
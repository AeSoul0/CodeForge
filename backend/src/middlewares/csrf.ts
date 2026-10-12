/**
 * @file backend/src/middlewares/csrf.ts
 * @description Cross-Site Request Forgery protection for cookie sessions.
 *
 * The administrator session is an HttpOnly cookie issued with
 * SameSite=None in production (frontend and API live on different sites),
 * so the browser attaches it to cross-site requests. Two independent
 * checks are applied to every state-changing request that carries the
 * session cookie:
 *
 * 1. Origin verification: when the browser reports an Origin (or, as a
 *    fallback, a Referer), it must belong to the CORS allowlist.
 * 2. Custom request header: `X-Requested-With: CodeForge` must be present.
 *    Cross-origin pages cannot set custom headers without a successful
 *    CORS preflight, which the allowlist rejects for unknown origins.
 *
 * The login endpoint receives the origin check even without a cookie to
 * prevent login CSRF. Requests without the session cookie (public reads,
 * scripts using other credentials) are not exposed to CSRF and pass through.
 */

import type {
    FastifyReply,
    FastifyRequest,
} from 'fastify';

export const CSRF_HEADER_NAME =
    'x-requested-with';

export const CSRF_HEADER_VALUE =
    'CodeForge';

const SAFE_METHODS =
    new Set([
        'GET',
        'HEAD',
        'OPTIONS',
    ]);

const SESSION_COOKIE_NAME =
    'token';

const LOGIN_PATH =
    '/api/auth/login';

/**
 * Extract the origin (scheme + host + port) from a Referer header.
 */
function originFromReferer(
    referer: string | undefined,
): string | undefined {
    if (!referer) {
        return undefined;
    }

    try {
        return new URL(referer).origin;
    } catch {
        return undefined;
    }
}

function rejectCsrf(
    reply: FastifyReply,
    code: string,
    message: string,
) {
    return reply
        .status(403)
        .send({
            success: false,
            error: {
                code,
                message,
            },
        });
}

/**
 * Build the CSRF guard for the given list of trusted browser origins.
 */
export function createCsrfGuard(
    allowedOrigins: readonly string[],
) {
    const trustedOrigins =
        new Set(
            allowedOrigins.map(
                (origin) =>
                    origin.replace(/\/$/, ''),
            ),
        );

    return async function csrfGuard(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        if (
            SAFE_METHODS.has(
                request.method,
            )
        ) {
            return;
        }

        const hasSessionCookie =
            Boolean(
                request.cookies?.[
                    SESSION_COOKIE_NAME
                ],
            );

        const path =
            request.url.split('?')[0];

        const isLogin =
            path === LOGIN_PATH;

        if (
            !hasSessionCookie &&
            !isLogin
        ) {
            return;
        }

        const origin =
            request.headers.origin ??
            originFromReferer(
                request.headers.referer,
            );

        if (
            origin &&
            !trustedOrigins.has(origin)
        ) {
            request.log.warn(
                {
                    origin,
                },
                '[CSRF] Rejected request from untrusted origin.',
            );

            return rejectCsrf(
                reply,
                'CSRF_ORIGIN_REJECTED',
                'Request origin is not allowed.',
            );
        }

        if (!hasSessionCookie) {
            return;
        }

        if (
            request.headers[
                CSRF_HEADER_NAME
            ] !== CSRF_HEADER_VALUE
        ) {
            request.log.warn(
                '[CSRF] Missing anti-CSRF request header.',
            );

            return rejectCsrf(
                reply,
                'CSRF_HEADER_MISSING',
                'Missing anti-CSRF request header.',
            );
        }
    };
}

/**
 * @file backend/src/services/TokenRevocationService.ts
 * @description Server-side revocation of admin JWTs.
 *
 * A JWT stays valid until it expires (24 hours). Logging out revokes it on
 * the server too, so a copied cookie cannot be reused after logout.
 */

import { createHash } from 'node:crypto';

import type { FastifyRequest } from 'fastify';

import {
    revokedTokenRepository,
} from '../repositories/RevokedTokenRepository';

/**
 * The raw JWT of a request, read from the same places as @fastify/jwt:
 * the Authorization header first, then the `token` cookie.
 */
export function getRequestToken(
    request: FastifyRequest,
): string | undefined {
    const header =
        request.headers?.authorization;

    if (header?.startsWith('Bearer ')) {
        return header.slice(7).trim() || undefined;
    }

    return request.cookies?.token || undefined;
}

export function hashToken(
    token: string,
): string {
    return createHash('sha256')
        .update(token)
        .digest('hex');
}

export class TokenRevocationService {
    /**
     * Revoke a verified token until its `exp` claim (seconds since epoch).
     */
    async revoke(
        token: string,
        expiresAtSeconds: number,
    ) {
        const expiresAt =
            new Date(expiresAtSeconds * 1000);

        // An expired token is rejected anyway; nothing to store.
        if (expiresAt.getTime() <= Date.now()) {
            return;
        }

        await revokedTokenRepository.add(
            hashToken(token),
            expiresAt,
        );
    }

    async isRevoked(
        token: string,
    ) {
        return revokedTokenRepository.exists(
            hashToken(token),
        );
    }

    /**
     * True when the request carries a token that was revoked at logout.
     */
    async isRequestRevoked(
        request: FastifyRequest,
    ) {
        const token =
            getRequestToken(request);

        return token
            ? this.isRevoked(token)
            : false;
    }
}

export const tokenRevocationService =
    new TokenRevocationService();

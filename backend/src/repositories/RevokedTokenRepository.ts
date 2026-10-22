/**
 * @file backend/src/repositories/RevokedTokenRepository.ts
 * @description Database repository for revoked admin JWTs.
 */

import { RevokedToken } from '../models/RevokedToken';

export class RevokedTokenRepository {
    async add(tokenHash: string, expiresAt: Date) {
        // Upsert: logging out twice with the same token is not an error.
        await RevokedToken.updateOne(
            { tokenHash },
            { $setOnInsert: { tokenHash, expiresAt } },
            { upsert: true },
        );
    }

    async exists(tokenHash: string) {
        return (await RevokedToken.exists({ tokenHash })) !== null;
    }
}

export const revokedTokenRepository = new RevokedTokenRepository();

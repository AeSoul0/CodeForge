/**
 * @file backend/src/models/RevokedToken.ts
 * @description Server-side denylist of admin JWTs revoked at logout.
 *
 * Only the SHA-256 hash of a token is stored. Each entry expires when the
 * token itself would have expired (at most 24 hours after login), and the
 * MongoDB TTL index then deletes it, so the collection never grows.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IRevokedToken extends Document {
    tokenHash: string;
    expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
    {
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

revokedTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);

export const RevokedToken = mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);

/**
 * @file backend/src/utils/seedAdmin.ts
 * @description Bootstrap for the initial administrative account.
 */

import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin';

export async function seedAdmin(): Promise<void> {
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
        return;
    }

    const adminApiKey = process.env.ADMIN_API_KEY?.trim();

    if (!adminApiKey) {
        throw new Error(
            'ADMIN_API_KEY is required when no administrator account exists. Refusing to bootstrap with a default credential.',
        );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminApiKey, salt);

    await Admin.create({
        username: 'admin',
        passwordHash,
    });

    console.log('✅ Admin user seeded successfully.');
}
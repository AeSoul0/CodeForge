/**
 * @file backend/src/utils/seedAdmin.ts
 * @description Bootstrap for the initial administrative account.
 */

import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin';

export async function seedAdmin(): Promise<void> {
    const adminApiKey = process.env.ADMIN_API_KEY?.trim();

    if (!adminApiKey) {
        throw new Error(
            'ADMIN_API_KEY is required to bootstrap or update the administrator account.',
        );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminApiKey, salt);

    const adminCount = await Admin.countDocuments({ username: 'admin' });

    if (adminCount > 0) {
        await Admin.updateOne({ username: 'admin' }, { passwordHash });
        console.log('✅ Admin password synchronized with environment variables.');
        return;
    }

    await Admin.create({
        username: 'admin',
        passwordHash,
    });

    console.log('✅ Admin user seeded successfully.');
}
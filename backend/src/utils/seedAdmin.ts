/**
 * @file backend/src/utils/seedAdmin.ts
 * @description Core module for CodeForge application.
 */

import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin';

export async function seedAdmin() {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const username = 'admin';
        // Fallback to a default if ADMIN_API_KEY is not used as the initial password
        const password = process.env.ADMIN_API_KEY || 'super_secret_dev_key';
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        await Admin.create({ username, passwordHash });
        console.log('✅ Admin user seeded successfully. Use ADMIN_API_KEY as the initial password.');
    }
}

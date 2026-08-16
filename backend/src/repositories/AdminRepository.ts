/**
 * @file backend/src/repositories/AdminRepository.ts
 * @description Database repository for interacting with MongoDB.
 */

import { Admin } from '../models/Admin';

export class AdminRepository {
    async findByUsername(username: string) {
        return Admin.findOne({ username });
    }

    async findById(id: string) {
        return Admin.findById(id);
    }
}

export const adminRepository = new AdminRepository();

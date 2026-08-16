import { adminRepository } from '../repositories/AdminRepository';
import { UnauthorizedError } from '../errors/AppError';
import bcrypt from 'bcrypt';

export class AdminService {
    async validateCredentials(username: string, passwordHashAttempt: string) {
        const admin = await adminRepository.findByUsername(username);
        if (!admin) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(passwordHashAttempt, admin.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        return admin;
    }
}

export const adminService = new AdminService();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Admin } from './src/models/Admin';

dotenv.config();

async function seedAdmin() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not set in .env');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        const username = 'admin';
        const rawPassword = 'password123'; // Cambia questa password dopo il primo login!
        
        const existingAdmin = await Admin.findOne({ username });
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        
        if (existingAdmin) {
            existingAdmin.passwordHash = passwordHash;
            await existingAdmin.save();
            console.log(`Admin account '${username}' password reset to '${rawPassword}'.`);
        } else {
            await Admin.create({
                username,
                passwordHash
            });
            console.log(`✅ Admin account created successfully!`);
        }

        console.log(`Username: ${username}`);
        console.log(`Password: ${rawPassword}`);
        console.log(`(You can now login at /admin/login)`);
        
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();

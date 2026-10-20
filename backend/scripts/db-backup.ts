/**
 * @file backend/scripts/db-backup.ts
 * @description CLI around src/utils/backup.ts.
 *
 *   npm run db:backup -- dump backups/2026-10-20
 *   npm run db:backup -- restore backups/2026-10-20 --drop
 *
 * Reads MONGODB_URI from backend/.env (via dotenvx in the npm script).
 */

import mongoose from 'mongoose';

import { dumpDatabase, restoreDatabase } from '../src/utils/backup';

async function main(): Promise<void> {
    const [command, directory, flag] = process.argv.slice(2);
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri || !directory || !['dump', 'restore'].includes(command)) {
        console.error('Usage: db:backup -- dump|restore <directory> [--drop]  (needs MONGODB_URI)');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(uri);

    try {
        const db = mongoose.connection.db!;
        const result = command === 'dump'
            ? (await dumpDatabase(db, directory)).collections
            : await restoreDatabase(db, directory, { drop: flag === '--drop' });

        console.log(`${command} ${db.databaseName} (${directory}):`, result);
    } finally {
        await mongoose.disconnect();
    }
}

void main();

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import mongoose from 'mongoose';
import { afterAll, describe, expect, it } from 'vitest';

import { dumpDatabase, restoreDatabase } from '../../src/utils/backup';

/**
 * Backup round trip against the real test database: dump, wipe, restore,
 * and compare documents including ObjectIds, dates and binary data.
 */
describe('database backup and restore', () => {
    let directory = '';

    afterAll(async () => {
        await mongoose.connection.db!.collection('backup_probe').drop().catch(() => undefined);

        if (directory) {
            await rm(directory, { recursive: true, force: true });
        }
    });

    it('restores exactly what it dumped', async () => {
        const db = mongoose.connection.db!;
        const probe = db.collection('backup_probe');
        const original = {
            _id: new mongoose.Types.ObjectId(),
            title: 'Città Digitale',
            createdAt: new Date('2025-10-01T00:00:00.000Z'),
            logo: new mongoose.mongo.Binary(Buffer.from([0, 1, 2, 255])),
        };

        await probe.deleteMany({});
        await probe.insertOne(original);

        directory = await mkdtemp(path.join(os.tmpdir(), 'codeforge-backup-'));
        const manifest = await dumpDatabase(db, directory);

        expect(manifest.collections.backup_probe).toBe(1);
        expect(JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8')).database)
            .toBe(db.databaseName);

        await probe.deleteMany({});
        await probe.insertOne({ title: 'written after the backup' });

        const restored = await restoreDatabase(db, directory, { drop: true });

        expect(restored.backup_probe).toBe(1);
        expect(await probe.find().toArray()).toEqual([original]);

        // Without --drop, existing _ids make the restore fail instead of
        // silently duplicating data.
        await expect(restoreDatabase(db, directory)).rejects.toThrow(/duplicate key/);
    });
});

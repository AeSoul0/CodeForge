/**
 * @file backend/src/utils/backup.ts
 * @description Dump every collection of a MongoDB database to Extended JSON
 * files and restore them, using the driver bundled with Mongoose.
 *
 * Canonical EJSON keeps ObjectIds, dates and binary data (experience logos)
 * exact, so a restored database is identical to the dumped one.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { mongo } from 'mongoose';

const { EJSON } = mongo.BSON;

const MANIFEST = 'manifest.json';

export interface BackupManifest {
    createdAt: string;
    database: string;
    collections: Record<string, number>;
}

/**
 * Write `<collection>.json` per collection plus a manifest with the counts.
 */
export async function dumpDatabase(
    db: mongo.Db,
    directory: string,
): Promise<BackupManifest> {
    await mkdir(directory, { recursive: true });

    const manifest: BackupManifest = {
        createdAt: new Date().toISOString(),
        database: db.databaseName,
        collections: {},
    };

    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    for (const { name } of collections) {
        if (name.startsWith('system.')) {
            continue;
        }

        const documents = await db.collection(name).find().toArray();

        await writeFile(
            path.join(directory, `${name}.json`),
            EJSON.stringify(documents, { relaxed: false }),
        );

        manifest.collections[name] = documents.length;
    }

    await writeFile(path.join(directory, MANIFEST), JSON.stringify(manifest, null, 2));

    return manifest;
}

/**
 * Load a dump written by dumpDatabase. With `drop`, each collection is
 * emptied first so the result matches the dump exactly; without it,
 * documents whose _id already exists make the restore fail.
 */
export async function restoreDatabase(
    db: mongo.Db,
    directory: string,
    { drop = false }: { drop?: boolean } = {},
): Promise<Record<string, number>> {
    const restored: Record<string, number> = {};
    const files = (await readdir(directory)).filter(
        (file) => file.endsWith('.json') && file !== MANIFEST,
    );

    for (const file of files) {
        const name = file.slice(0, -'.json'.length);
        const documents = EJSON.parse(
            await readFile(path.join(directory, file), 'utf8'),
            { relaxed: false },
        ) as mongo.Document[];
        const collection = db.collection(name);

        if (drop) {
            await collection.deleteMany({});
        }

        if (documents.length) {
            await collection.insertMany(documents);
        }

        restored[name] = documents.length;
    }

    return restored;
}

/**
 * @file scripts/projects/backfill-project-timestamps.ts
 * @description Backfills missing createdAt/updatedAt timestamps on legacy
 * project documents.
 *
 * Safety:
 * - Dry-run by default.
 * - Use --apply to actually write changes.
 * - Existing timestamps are never overwritten.
 * - For legacy documents without createdAt, the MongoDB ObjectId timestamp
 *   is used because it represents the approximate document creation time.
 */

import "../../backend/src/config/env";

import mongoose from "mongoose";

import Project from "../../backend/src/models/Projects";

type MigrationStats = {
    scanned: number;
    needsCreatedAt: number;
    needsUpdatedAt: number;
    updated: number;
};

const APPLY = process.argv.includes("--apply");

async function connect(): Promise<void> {
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
        throw new Error(
            "MONGODB_URI is missing from environment variables.",
        );
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected.");
}

function getLegacyCreatedAt(
    id: mongoose.Types.ObjectId,
): Date {
    return id.getTimestamp();
}

async function migrate(): Promise<MigrationStats> {
    const stats: MigrationStats = {
        scanned: 0,
        needsCreatedAt: 0,
        needsUpdatedAt: 0,
        updated: 0,
    };

    const projects = await Project.find({})
        .select("_id createdAt updatedAt titolo")
        .lean();

    stats.scanned = projects.length;

    console.log(
        `\nFound ${projects.length} project document(s).`,
    );

    for (const project of projects) {
        const needsCreatedAt = !project.createdAt;
        const needsUpdatedAt = !project.updatedAt;

        if (!needsCreatedAt && !needsUpdatedAt) {
            continue;
        }

        if (needsCreatedAt) {
            stats.needsCreatedAt += 1;
        }

        if (needsUpdatedAt) {
            stats.needsUpdatedAt += 1;
        }

        const createdAt = project.createdAt
            ? new Date(project.createdAt)
            : getLegacyCreatedAt(project._id);

        const updatedAt = project.updatedAt
            ? new Date(project.updatedAt)
            : createdAt;

        const title =
            typeof project.titolo === "string" &&
            project.titolo.trim()
                ? project.titolo.trim()
                : String(project._id);

        console.log(
            `${APPLY ? "UPDATE" : "DRY-RUN"} | ${title} | ` +
            `createdAt=${createdAt.toISOString()} | ` +
            `updatedAt=${updatedAt.toISOString()}`,
        );

        if (!APPLY) {
            continue;
        }

        const update: Record<string, Date> = {};

        if (needsCreatedAt) {
            update.createdAt = createdAt;
        }

        if (needsUpdatedAt) {
            update.updatedAt = updatedAt;
        }

        await Project.updateOne(
            { _id: project._id },
            {
                $set: update,
            },
        );

        stats.updated += 1;
    }

    return stats;
}

async function main(): Promise<void> {
    try {
        console.log(
            "\n==============================================",
        );

        console.log(
            "CodeForge - Project Timestamp Backfill",
        );

        console.log(
            "==============================================\n",
        );

        if (!APPLY) {
            console.log(
                "DRY RUN: no database changes will be made.",
            );

            console.log(
                "Use --apply to write the migration.\n",
            );
        } else {
            console.log(
                "APPLY MODE: database changes will be written.\n",
            );
        }

        await connect();

        const stats = await migrate();

        console.log(
            "\n----------------------------------------------",
        );

        console.log(
            `Scanned:          ${stats.scanned}`,
        );

        console.log(
            `Missing createdAt: ${stats.needsCreatedAt}`,
        );

        console.log(
            `Missing updatedAt: ${stats.needsUpdatedAt}`,
        );

        console.log(
            `${APPLY ? "Updated" : "Would update"}:       ${stats.updated}`,
        );

        console.log(
            "----------------------------------------------\n",
        );

        if (!APPLY && (stats.needsCreatedAt || stats.needsUpdatedAt)) {
            console.log(
                "Run again with --apply to apply the migration.",
            );
        } else if (stats.needsCreatedAt || stats.needsUpdatedAt) {
            console.log(
                "✅ Migration completed.",
            );
        } else {
            console.log(
                "✅ No legacy project timestamps need repair.",
            );
        }
    } catch (error) {
        console.error(
            "\n❌ Project timestamp migration failed:",
            error,
        );

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

void main();
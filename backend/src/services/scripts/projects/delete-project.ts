/**
 * @file backend/src/services/scripts/delete-project.ts
 * @description Interactive CLI for deleting an existing project
 * through the backend API.
 *
 * The project can be identified by either its MongoDB ID
 * or its exact project title.
 */

import "dotenv/config";
import * as readline from "readline/promises";
import {
    stdin as input,
    stdout as output,
} from "process";

const rl = readline.createInterface({
    input,
    output,
});

const API_KEY =
    process.env.ADMIN_API_KEY;

const API_URL =
    process.env.PUBLIC_API_URL ||
    "http://localhost:3002";

if (!API_KEY) {
    console.error(
        "❌ ERROR: ADMIN_API_KEY not found in environment variables.",
    );

    process.exit(1);
}

/**
 * Prompt the user for a value.
 */
async function ask(
    question: string,
): Promise<string> {
    return rl.question(
        `\x1b[36m?\x1b[0m ${question} `,
    );
}

/**
 * Resolve a project ID from either a MongoDB ID
 * or an exact project title.
 */
async function resolveProjectId(
    value: string,
): Promise<string | null> {
    const trimmed = value.trim();

    if (/^[a-f\d]{24}$/i.test(trimmed)) {
        return trimmed;
    }

    const response = await fetch(
        `${API_URL}/api/projects`,
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch projects. Status ${response.status}`,
        );
    }

    const data: unknown =
        await response.json();

    if (!Array.isArray(data)) {
        throw new Error(
            "Projects API returned an invalid response.",
        );
    }

    const matches = data.filter(
        (project) =>
            typeof project?.titolo ===
            "string" &&
            project.titolo
                .trim()
                .toLowerCase() ===
            trimmed.toLowerCase(),
    );

    if (matches.length === 0) {
        console.error(
            `❌ Project "${trimmed}" not found.`,
        );

        return null;
    }

    if (matches.length > 1) {
        console.error(
            `❌ Multiple projects match "${trimmed}". Use the MongoDB ID instead.`,
        );

        return null;
    }

    return String(matches[0]._id);
}

async function main(): Promise<void> {
    console.log(
        "\n=============================================",
    );

    console.log(
        "🗑️ CodeForge Admin CLI - Delete Project",
    );

    console.log(
        "=============================================\n",
    );

    try {
        /*
         * The user can enter either the MongoDB ID
         * or the exact project title.
         */
        const identifier =
            await ask(
                "Project ID or title:",
            );

        const projectId =
            await resolveProjectId(
                identifier,
            );

        if (!projectId) {
            return;
        }

        const confirmation =
            await ask(
                'Type "DELETE" to confirm:',
            );

        /*
         * Require explicit confirmation before deleting
         * the database record.
         */
        if (
            confirmation.trim() !==
            "DELETE"
        ) {
            console.log(
                "❌ Deletion cancelled.",
            );

            return;
        }

        console.log(
            "\n⏳ Deleting project...",
        );

        const response =
            await fetch(
                `${API_URL}/api/projects/${projectId}`,
                {
                    method: "DELETE",

                    headers: {
                        "x-api-key":
                            API_KEY,
                    },
                },
            );

        if (response.ok) {
            console.log(
                "\n✅ Project deleted successfully.",
            );
        } else {
            let errorData: unknown;

            try {
                errorData =
                    await response.json();
            } catch {
                errorData =
                    await response.text();
            }

            console.error(
                "\n❌ SERVER ERROR:",
                response.status,
            );

            console.error(
                errorData,
            );
        }
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : String(error);

        console.error(
            "\n❌ CONNECTION ERROR:",
            message,
        );
    } finally {
        rl.close();
    }
}

main();
/**
 * @file backend/src/services/scripts/patch-experience.ts
 * @description Interactive CLI for updating an existing experience
 * through the backend API.
 *
 * The experience can be identified by:
 * - MongoDB ID
 * - exact role
 * - exact company
 */

import "../../../config/env";
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
 * Resolve an experience ID from either a MongoDB ID,
 * an exact role, or an exact company name.
 */
async function resolveExperienceId(
    value: string,
): Promise<string | null> {
    const trimmed = value.trim();

    if (/^[a-f\d]{24}$/i.test(trimmed)) {
        return trimmed;
    }

    const response = await fetch(
        `${API_URL}/api/experiences`,
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch experiences. Status ${response.status}`,
        );
    }

    const data: unknown =
        await response.json();

    if (!Array.isArray(data)) {
        throw new Error(
            "Experiences API returned an invalid response.",
        );
    }

    const normalized =
        trimmed.toLowerCase();

    const matches = data.filter(
        (experience) => {
            const role =
                typeof experience?.role ===
                    "string"
                    ? experience.role
                        .trim()
                        .toLowerCase()
                    : "";

            const company =
                typeof experience?.company ===
                    "string"
                    ? experience.company
                        .trim()
                        .toLowerCase()
                    : "";

            return (
                role === normalized ||
                company === normalized
            );
        },
    );

    if (matches.length === 0) {
        console.error(
            `❌ Experience "${trimmed}" not found.`,
        );

        return null;
    }

    if (matches.length > 1) {
        console.error(
            `❌ Multiple experiences match "${trimmed}". Use the MongoDB ID instead.`,
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
        "🛠️ CodeForge Admin CLI - Patch Experience",
    );

    console.log(
        "=============================================\n",
    );

    try {
        const identifier =
            await ask(
                "Experience ID, role, or company:",
            );

        const experienceId =
            await resolveExperienceId(
                identifier,
            );

        if (!experienceId) {
            return;
        }

        const role =
            await ask(
                "New role (leave empty to keep unchanged):",
            );

        const company =
            await ask(
                "New company (leave empty to keep unchanged):",
            );

        const description =
            await ask(
                "New description (leave empty to keep unchanged):",
            );

        const technologiesInput =
            await ask(
                "New technologies, comma-separated (leave empty to keep unchanged):",
            );

        const startDate =
            await ask(
                "New start date YYYY-MM-DD (leave empty to keep unchanged):",
            );

        const currentInput =
            await ask(
                'Current status "y/n" (leave empty to keep unchanged):',
            );

        const endDate =
            await ask(
                "New end date YYYY-MM-DD (leave empty to keep unchanged):",
            );

        const image =
            await ask(
                "New image URL (leave empty to keep unchanged):",
            );

        const payload: Record<
            string,
            unknown
        > = {};

        if (role.trim() !== "") {
            payload.role =
                role.trim();
        }

        if (company.trim() !== "") {
            payload.company =
                company.trim();
        }

        if (description.trim() !== "") {
            payload.description =
                description.trim();
        }

        if (
            technologiesInput.trim() !==
            ""
        ) {
            payload.technologies =
                technologiesInput
                    .split(",")
                    .map(
                        (value) =>
                            value.trim(),
                    )
                    .filter(Boolean);
        }

        if (startDate.trim() !== "") {
            payload.startDate =
                startDate.trim();
        }

        if (
            currentInput.trim() !==
            ""
        ) {
            payload.current =
                currentInput
                    .trim()
                    .toLowerCase() ===
                "y";
        }

        if (endDate.trim() !== "") {
            payload.endDate =
                endDate.trim();
        }

        if (image.trim() !== "") {
            payload.image =
                image.trim();
        }

        /*
         * Prevent sending an empty PATCH request.
         */
        if (
            Object.keys(payload)
                .length === 0
        ) {
            console.log(
                "⚠️ No fields selected for update.",
            );

            return;
        }

        console.log(
            "\n⏳ Updating experience...",
        );

        const response =
            await fetch(
                `${API_URL}/api/experiences/${experienceId}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "x-api-key":
                            API_KEY,
                    },

                    body: JSON.stringify(
                        payload,
                    ),
                },
            );

        if (response.ok) {
            const data =
                await response.json();

            console.log(
                "\n✅ Experience updated successfully.",
            );

            console.log(data);
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

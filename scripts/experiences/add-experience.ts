/**
 * @file backend/src/services/scripts/add-experience.ts
 * @description Interactive CLI for creating a professional or
 * academic experience through the backend API.
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

interface ExperiencePayload {
    role: string;
    company: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate?: string | null;
    current: boolean;
    image?: string | null;
}

async function main(): Promise<void> {
    console.log(
        "\n=============================================",
    );

    console.log(
        "🚀 CodeForge Admin CLI - Add Experience",
    );

    console.log(
        "=============================================\n",
    );

    try {
        const role =
            await ask("Role:");

        const company =
            await ask(
                "Company / Organization:",
            );

        const description =
            await ask("Description:");

        const technologiesInput =
            await ask(
                "Technologies (comma-separated):",
            );

        const startDate =
            await ask(
                "Start date (YYYY-MM-DD):",
            );

        const currentInput =
            await ask(
                'Is this current? (y/n):',
            );

        const endDateInput =
            await ask(
                "End date (YYYY-MM-DD, leave empty if current):",
            );

        const image =
            await ask(
                "Image URL (leave empty if none):",
            );

        const technologies =
            technologiesInput
                .split(",")
                .map(
                    (technology) =>
                        technology.trim(),
                )
                .filter(Boolean);

        const current =
            currentInput
                .trim()
                .toLowerCase() === "y";

        const endDate =
            current ||
                endDateInput.trim() === ""
                ? null
                : endDateInput.trim();

        const imageValue =
            image.trim() !== ""
                ? image.trim()
                : null;

        const payload: ExperiencePayload = {
            role: role.trim(),
            company: company.trim(),
            description:
                description.trim(),
            technologies,
            startDate:
                startDate.trim(),
            endDate,
            current,
            image: imageValue,
        };

        console.log(
            "\n⏳ Sending experience to backend...",
        );

        const response =
            await fetch(
                `${API_URL}/api/experiences`,
                {
                    method: "POST",

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
                "\n✅ Experience added successfully.",
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

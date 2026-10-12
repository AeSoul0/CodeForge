/**
 * @file backend/src/utils/settings.ts
 * @description Helpers for reading numeric settings from the environment.
 */

/**
 * Parse a positive integer setting, falling back to a default.
 */
export function positiveInteger(
    value: string | undefined,
    fallback: number,
): number {
    const parsed =
        Number(value);

    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
}

/**
 * @file src/lib/content.ts
 * @description Server-side loaders for public portfolio content.
 */

import {
    extractList,
} from './api';

/**
 * Upper bound accepted by the backend pagination schema.
 */
export const COLLECTION_LIMIT = 100;

export interface PortfolioContent<P, E> {
    projects: P[];
    experiences: E[];
    apiError: boolean;
}

async function fetchCollection<T>(
    url: string,
    fetchImpl: typeof fetch,
    init?: RequestInit,
): Promise<T[]> {
    const response =
        await fetchImpl(url, init);

    if (!response.ok) {
        throw new Error(
            `Request to ${url} failed with status ${response.status}`,
        );
    }

    const list =
        extractList<T>(await response.json());

    if (!list) {
        throw new Error(
            `Unexpected payload from ${url}`,
        );
    }

    return list;
}

/**
 * Fetch every project.
 */
export function fetchProjects<P>(
    apiUrl: string,
    fetchImpl: typeof fetch = fetch,
    init?: RequestInit,
): Promise<P[]> {
    return fetchCollection<P>(
        `${apiUrl}/api/projects?limit=${COLLECTION_LIMIT}`,
        fetchImpl,
        init,
    );
}

/**
 * Fetch projects and experiences in parallel for the homepage.
 *
 * Failures are reported through `apiError` so the page can still render.
 */
export async function loadPortfolioContent<P, E>(
    apiUrl: string,
    fetchImpl: typeof fetch = fetch,
    logger: Pick<Console, 'error'> = console,
): Promise<PortfolioContent<P, E>> {
    try {
        const [projects, experiences] =
            await Promise.all([
                fetchProjects<P>(apiUrl, fetchImpl),
                fetchCollection<E>(
                    `${apiUrl}/api/experiences?limit=${COLLECTION_LIMIT}`,
                    fetchImpl,
                ),
            ]);

        return {
            projects,
            experiences,
            apiError: false,
        };
    } catch (error) {
        logger.error(
            '[Backend Connection Error] Failed to fetch homepage data:',
            error,
        );

        return {
            projects: [],
            experiences: [],
            apiError: true,
        };
    }
}

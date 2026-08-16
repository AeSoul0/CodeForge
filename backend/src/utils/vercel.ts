/**
 * @file backend/src/utils/vercel.ts
 * @description Provides utilities to interact with Vercel Deploy Hooks.
 * This is used to trigger static site rebuilds (ISR/SSG) whenever
 * database records (like projects or experiences) are created, updated, or deleted.
 */

export async function triggerVercelDeploy() {
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!deployHookUrl) {
        console.warn('[Vercel] No VERCEL_DEPLOY_HOOK_URL configured. Skipping static redeploy.');
        return;
    }

    try {
        console.log(`[Vercel] Triggering deployment webhook...`);
        const response = await fetch(deployHookUrl, { method: 'POST' });
        
        if (response.ok) {
            console.log('[Vercel] Deployment successfully triggered.');
        } else {
            console.error(`[Vercel] Failed to trigger deployment. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('[Vercel] Error triggering deployment:', error);
    }
}

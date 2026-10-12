/**
 * @file frontend/scripts/serve-build.mjs
 * @description Serve the Vercel build output locally (static files plus the
 * SSR function) so production-only behaviour such as the CSP meta tag can
 * be verified with a real browser.
 *
 * Usage: npm run build && node scripts/serve-build.mjs [port]
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../.vercel/output/', import.meta.url));
const staticDir = join(root, 'static');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4322);

const { default: handler } = await import(
    pathToFileURL(join(root, 'functions/_render.func/dist/server/entry.mjs')).href
);

const MIME = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
};

async function serveStatic(pathname, res) {
    const file = normalize(join(staticDir, decodeURIComponent(pathname)));

    if (!file.startsWith(staticDir)) {
        return false;
    }

    try {
        const info = await stat(file);

        if (!info.isFile()) {
            return false;
        }
    } catch {
        return false;
    }

    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);

    return true;
}

createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (await serveStatic(url.pathname, res)) {
        return;
    }

    const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req),
        duplex: 'half',
    });

    const response = await handler.fetch(request);

    res.writeHead(response.status, Object.fromEntries(response.headers));

    if (response.body) {
        Readable.fromWeb(response.body).pipe(res);
    } else {
        res.end();
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Serving build at http://127.0.0.1:${port}`);
});

/**
 * @file src/lib/markdown.ts
 * @description Safe Markdown rendering for project documentation.
 *
 * marked does not sanitise its output: raw HTML blocks and `javascript:`
 * links pass through untouched. Project descriptions come from the admin
 * API and from AI generation, so both are neutralised here:
 *
 * - raw HTML (block and inline) is escaped and shown as text;
 * - links and images are only emitted for http(s), mailto, relative and
 *   fragment URLs; anything else is rendered as plain text.
 */

import {
    Marked,
    type Tokens,
} from 'marked';

import {
    escapeHtml,
} from './dom';

const SAFE_URL =
    /^(https?:|mailto:|#|\.{1,2}\/|\/(?!\/))/i;

/**
 * Whether a URL may be used in an href/src attribute.
 */
export function isSafeUrl(
    url: string | null | undefined,
): boolean {
    if (!url) {
        return false;
    }

    // Strip control characters and whitespace browsers ignore in schemes.
    const normalized =
        [...url]
            .filter((character) => {
                const code = character.charCodeAt(0);

                return code > 0x20 && (code < 0x7f || code > 0x9f);
            })
            .join('');

    return SAFE_URL.test(normalized);
}

const markdown =
    new Marked({
        gfm: true,
        breaks: false,
        renderer: {
            html({ text }: Tokens.HTML | Tokens.Tag): string {
                return escapeHtml(text);
            },

            link(token: Tokens.Link): string {
                const label =
                    this.parser.parseInline(token.tokens);

                if (!isSafeUrl(token.href)) {
                    return label;
                }

                const title =
                    token.title
                        ? ` title="${escapeHtml(token.title)}"`
                        : '';

                const external =
                    /^https?:/i.test(token.href)
                        ? ' target="_blank" rel="noopener noreferrer"'
                        : '';

                return `<a href="${escapeHtml(token.href)}"${title}${external}>${label}</a>`;
            },

            image(token: Tokens.Image): string {
                if (!isSafeUrl(token.href)) {
                    return escapeHtml(token.text);
                }

                const title =
                    token.title
                        ? ` title="${escapeHtml(token.title)}"`
                        : '';

                return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text)}"${title} loading="lazy">`;
            },
        },
    });

/**
 * Render Markdown to HTML that is safe to insert with `set:html`.
 */
export function renderMarkdown(
    source: string,
): string {
    return markdown.parse(source, {
        async: false,
    });
}

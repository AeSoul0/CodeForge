import { describe, expect, it } from 'vitest';

import { isSafeUrl, renderMarkdown } from '../../src/lib/markdown';

describe('isSafeUrl', () => {
    it.each([
        ['https://example.com', true],
        ['http://example.com', true],
        ['mailto:me@example.com', true],
        ['/relative/path', true],
        ['#anchor', true],
        ['./file.md', true],
        ['../up.md', true],
        ['javascript:alert(1)', false],
        ['JaVaScRiPt:alert(1)', false],
        ['java\u0000script:alert(1)', false],
        ['  javascript:alert(1)', false],
        ['java\u0085script:alert(1)', false],
        ['data:text/html,<script>', false],
        ['//evil.example', false],
        ['vbscript:x', false],
        ['', false],
        [null, false],
    ])('%j -> %s', (url, expected) => {
        expect(isSafeUrl(url)).toBe(expected);
    });
});

describe('renderMarkdown', () => {
    it('renders GitHub-flavoured Markdown', () => {
        const html = renderMarkdown('# Title\n\n**bold** and `code`\n\n- a\n- b');

        // The page owns the <h1>, so the top Markdown heading becomes an <h2>.
        expect(html).toContain('<h2>Title</h2>');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<code>code</code>');
        expect(html).toContain('<li>a</li>');
    });

    it('shifts headings so the highest is an h2 and no level is skipped', () => {
        // AI-generated docs often start at ###.
        expect(renderMarkdown('### Overview\n\n#### Detail\n\n### Next')).toBe(
            '<h2>Overview</h2>\n<h3>Detail</h3>\n<h2>Next</h2>\n',
        );
        // Relative levels are kept and capped at h6; nested headings are shifted too.
        expect(renderMarkdown('# A\n\n###### Deep\n\n> ## Quoted')).toBe(
            '<h2>A</h2>\n<h6>Deep</h6>\n<blockquote>\n<h3>Quoted</h3>\n</blockquote>\n',
        );
        expect(renderMarkdown('No headings here.')).toBe('<p>No headings here.</p>\n');
    });

    it('escapes raw HTML blocks and inline tags', () => {
        const html = renderMarkdown('<script>alert(1)</script>\n\nhi <img src=x onerror=alert(1)>');

        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;script&gt;');
    });

    it('drops unsafe link and image URLs but keeps their text', () => {
        const html = renderMarkdown('[click](javascript:alert(1)) ![pic](javascript:x)');

        expect(html).not.toContain('href');
        expect(html).not.toContain('<img');
        expect(html).toContain('click');
        expect(html).toContain('pic');
    });

    it('renders safe links (external ones open in a new tab) and images', () => {
        const html = renderMarkdown('[ext](https://a.b "T") [int](/x) ![alt "q"](/img.png "Cap")');

        expect(html).toContain('<a href="https://a.b" title="T" target="_blank" rel="noopener noreferrer">ext</a>');
        expect(html).toContain('<a href="/x">int</a>');
        expect(html).toContain('<img src="/img.png" alt="alt &quot;q&quot;" title="Cap" loading="lazy">');
    });

    it('renders images without a title', () => {
        expect(renderMarkdown('![a](/b.png)')).toContain('<img src="/b.png" alt="a" loading="lazy">');
    });
});

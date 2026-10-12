// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { byId, clear, escapeHtml, h } from '../../src/lib/dom';

describe('escapeHtml', () => {
    it('escapes every HTML-significant character', () => {
        expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
            '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
        );
    });

    it('stringifies nullish values as empty', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
        expect(escapeHtml(5)).toBe('5');
    });
});

describe('h', () => {
    it('builds elements with attributes, class and text children', () => {
        const element = h('a', { href: '/x', class: 'link', hidden: true, disabled: false, title: null, tabindex: 0 }, 'Go ', 1, null, false, undefined);

        expect(element.outerHTML).toBe('<a href="/x" class="link" hidden="" tabindex="0">Go 1</a>');
    });

    it('never parses string children as HTML', () => {
        const element = h('div', {}, '<img src=x onerror=alert(1)>');

        expect(element.querySelector('img')).toBeNull();
        expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
    });

    it('appends node children', () => {
        const parent = h('ul', {}, h('li', {}, 'a'), h('li', {}, 'b'));

        expect(parent.children).toHaveLength(2);
    });
});

describe('clear / byId', () => {
    it('removes children', () => {
        const parent = h('div', {}, h('span'), 'text');
        clear(parent);
        expect(parent.childNodes).toHaveLength(0);
    });

    it('finds elements in documents and fragments, and throws when missing', () => {
        document.body.innerHTML = '<p id="target">x</p>';
        expect(byId('target').textContent).toBe('x');

        const fragment = document.createElement('div');
        fragment.append(h('span', { id: 'inner' }, 'y'));
        expect(byId('inner', fragment).textContent).toBe('y');

        expect(() => byId('missing')).toThrow('Missing required element #missing');
    });
});

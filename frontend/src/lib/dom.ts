/**
 * @file src/lib/dom.ts
 * @description Minimal helpers for building DOM without HTML strings.
 *
 * Data coming from the API is always written with textContent or
 * attributes, never interpolated into innerHTML, so stored values cannot
 * inject markup.
 */

type Child =
    | Node
    | string
    | number
    | null
    | undefined
    | false;

type Attributes = Record<
    string,
    string | number | boolean | null | undefined
>;

/**
 * Escape a value for safe interpolation into HTML.
 */
export function escapeHtml(
    value: unknown,
): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Create an element with attributes and children.
 *
 * - `class` sets className;
 * - `true` booleans become empty attributes, `false`/null/undefined are skipped;
 * - string children become text nodes.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes: Attributes = {},
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const element =
        document.createElement(tag);

    for (const [name, value] of Object.entries(attributes)) {
        if (
            value === false ||
            value === null ||
            value === undefined
        ) {
            continue;
        }

        if (name === 'class') {
            element.className =
                String(value);

            continue;
        }

        element.setAttribute(
            name,
            value === true
                ? ''
                : String(value),
        );
    }

    for (const child of children) {
        if (
            child === null ||
            child === undefined ||
            child === false
        ) {
            continue;
        }

        element.append(
            child instanceof Node
                ? child
                : document.createTextNode(String(child)),
        );
    }

    return element;
}

/**
 * Remove every child of an element.
 */
export function clear(
    element: Element,
): void {
    element.replaceChildren();
}

/**
 * Look up an element by id and fail loudly when the markup is out of sync.
 */
export function byId<T extends HTMLElement = HTMLElement>(
    id: string,
    root: Document | ParentNode = document,
): T {
    const element =
        'getElementById' in root
            ? (root as Document).getElementById(id)
            : root.querySelector(`#${CSS.escape(id)}`);

    if (!element) {
        throw new Error(
            `Missing required element #${id}`,
        );
    }

    return element as T;
}

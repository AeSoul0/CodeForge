# Architecture Decision Record: Astro Frontend

## Context
The CodeForge portfolio requires high SEO performance, fast load times, and an interactive UI.

## Decision
We selected **Astro** alongside **React** components for isolated islands of interactivity.

## Rationale
- **Astro**: Compiles down to static HTML, resulting in zero JS by default and maximizing Lighthouse scores and Core Web Vitals.
- **React Islands**: Used only where state and interactivity are strictly necessary, preventing JS bloat.
- **TailwindCSS**: Ensures utility-first, rapid UI development with a small production CSS footprint.

## Consequences
- Sub-second First Contentful Paint (FCP).
- Excellent accessibility and SEO structure out of the box.
- Slightly longer build step compared to raw HTML, but highly justifiable.

# Case Study: CodeForge

Published on the site at [/projects/codeforge](https://aesoul0.com/projects/codeforge).
Numbers: [metrics.md](../metrics.md).

## Problem

Portfolio content was managed by editing code: every update was a deploy and a
chance to introduce bugs. A GitHub repository alone also gives reviewers too
little context about a project's architecture, decisions and quality.

## Constraints

- Fast, content-first public site.
- No paid third-party CMS.
- Structured, validated data managed from a protected admin area.
- Quality must be measurable, not only claimed.

## Architecture

- **Frontend:** Astro on Vercel (SSR + ISR, 300 s), Tailwind CSS, small
  bundled TypeScript modules for interactivity; no UI framework runtime.
- **Backend:** Fastify + TypeScript on Render, Routes → Controllers →
  Services → Repositories, MongoDB Atlas through Mongoose.
- **AI documentation:** the backend reads a project's GitHub repository and
  generates its Markdown documentation with OpenAI (Gemini as fallback), in
  the background.

## Implementation

- Admin dashboard: overview, projects, experiences (with logo upload), API
  playground, system status.
- Experience logos stored in MongoDB and served by the API.
- Structured request logs, audit log for content changes, `/live`, `/ready`
  and `/metrics` endpoints.
- Custom 404 and 500 pages inside the site layout.

## Security

- JWT (HS256, issuer/audience, 24 h) in an HttpOnly, Secure cookie; logout
  revokes the token server-side (hashed denylist that a TTL index empties when
  each token expires).
- `SameSite=None` is required across the two sites, so a CSRF guard checks the
  origin and requires `X-Requested-With: CodeForge` on authenticated
  mutations.
- Hash-based CSP without `'unsafe-inline'`, Helmet, HSTS, CORS allowlist,
  rate limiting (5 logins/min), JSON schema validation.
- API data written to the DOM with `textContent` only; safe Markdown rendering.

## Performance

- Vercel ISR raised desktop Performance from 88 to 96 and cut LCP from 3.0 s
  to 2.2 s.
- 2026-10-20 production audit (median of 3 runs): Performance 99 desktop /
  92 mobile, Accessibility, Best Practices and SEO 100, CLS 0.

## Results

The portfolio demonstrates full-stack engineering through the system itself:
content lives in a database behind a protected dashboard, every layer is
tested (backend and frontend coverage gates, Playwright E2E with axe scans),
CI blocks regressions, and project documentation is generated from repository
evidence.

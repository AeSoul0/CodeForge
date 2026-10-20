# CodeForge Performance Baseline

## 1. Purpose

This document records the measured performance characteristics of the
production CodeForge homepage and the optimizations applied to improve the
initial rendering path.

The document distinguishes between:

* **measured results**;
* **performance targets**;
* **implemented optimizations**;
* **future measurements**.

No target value is presented as a measured result.

---

# 2. Production Route

Primary measured route:

```text
https://www.aesoul0.com/
```

The current baseline represents the deployed production homepage.
`www.aesoul0.com` now redirects (308) to `https://aesoul0.com/`, so new
measurements target the apex domain directly (see § 18).

---

# 3. Lighthouse Results

## Current Measurement

Latest captured Lighthouse result:

Current numbers: see [metrics.md](metrics.md).

---

# 4. Core Performance Metrics

Scores, LCP and CLS (desktop and mobile, median of 3 runs):
[metrics.md](metrics.md).

Details of the 2026-10-20 audit (Lighthouse 13.4.1, 3 desktop + 3 mobile
runs) that `metrics.md` does not list:

| Metric | Desktop runs | Mobile runs |
|---|---|---|
| Performance score | 97–99 | 87–94 |
| TTFB (server response) | 60–91 ms | 84–202 ms |
| Total Blocking Time | 0–5 ms | 200–366 ms |
| First Contentful Paint | 0.6–0.7 s | 1.8–1.9 s |

Mobile Performance was 95 on 2026-10-12 and 92 on 2026-10-20. The difference
is Total Blocking Time (0–20 ms then, 200–366 ms now), coming from the
homepage's inline scripts and the style and layout work they trigger under
the 4x CPU slowdown. The 2026-10-12 reports were not kept, so it is not yet
known whether the site or the measuring machine changed; both scores stay
above the 90 target.

## LCP

Below the 2.5 s target on both form factors. The mobile value is dominated by
Lighthouse's simulated slow-4G throttling, not by server time.

## CLS

0 in every run: no measurable layout shift.

## TTFB

The earlier single samples (680 ms and 770 ms) were not representative;
across six runs with ISR the server response stayed between 58 and 213 ms.

## INP

INP is a field metric: Lighthouse lab runs cannot measure it. The lab proxy,
Total Blocking Time, is 0–40 ms. A field INP value requires real-user data
(Chrome UX Report once the site has enough traffic, or Vercel Speed
Insights), so:

```text
INP: PENDING (field data)
```

No estimated INP value is published. On 2026-10-19 PageSpeed Insights still
reported too little CrUX data for `aesoul0.com`.

Lab interaction latency, measured the same day:

* **Method.** Playwright on production, reading the Event Timing API.
  * Pages: `/`, `/projects/codeforge` and `/admin/login`.
  * Interactions: project filter clicks, typing and Tab navigation.
* **Results.** The slowest interaction took 64 ms on desktop and 112 ms on a
  412 px mobile viewport with 4x CPU throttling.

Both results are below the 200 ms "good" threshold. They are supporting
evidence, not a substitute for field INP.

---

# 5. Previous Baseline

Before the latest performance optimization, the homepage measured:

| Metric      | Previous Result |
| ----------- | --------------: |
| Performance |          88/100 |
| LCP         |           3.0 s |
| CLS         |               0 |
| TTFB        |          680 ms |

This represented the original performance baseline used for the optimization
work.

---

# 6. Performance Optimization

## Vercel ISR

The frontend now uses Vercel Incremental Static Regeneration.

Current expiration:

```text
300 seconds
```

The goal is to reduce repeated server-side rendering work for cacheable
production responses while retaining the existing dynamic application
architecture.

## Measured Impact

Before ISR:

```text
Performance: 88/100
LCP:         3.0 s
```

After ISR (desktop, same session):

```text
Performance: 96/100
LCP:         2.2 s
```

Later changes raised desktop Performance further; current values are in
[metrics.md](metrics.md).

Measured difference:

```text
Performance: +8 Lighthouse points
LCP:         -0.8 seconds
```

This is the primary performance improvement currently supported by direct
measurement.

---

# 7. Frontend Rendering Strategy

CodeForge uses Astro with the Vercel adapter.

The application uses server rendering where dynamic behavior requires it and
ISR for cacheable production responses.

The strategy is:

```text
Browser
   ↓
Vercel / Astro
   ↓
ISR cache when applicable
   ↓
SSR when regeneration is required
   ↓
Fastify API
```

This avoids unnecessarily re-running the complete server rendering path for
every production request.

---

# 8. Hero / LCP Rendering

The homepage hero was deliberately structured so that visual animation does
not determine whether critical content can render.

The important content is available immediately:

```text
Heading
Supporting text
Primary CTA
Secondary CTA
```

Entrance animation acts as progressive enhancement rather than as a
requirement for initial content visibility.

This design prevents animation state from becoming a dependency for the LCP
element.

---

# 9. Decorative Particle System

The background particle system is intentionally treated as decorative work.

The implementation includes:

* adaptive particle counts;
* reduced-motion handling;
* visibility detection;
* animation-frame scheduling;
* reduced work on constrained environments;
* E2E-specific disabling of decorative simulation.

The particle layer therefore does not represent application-critical content.

---

# 10. Reduced Motion

The frontend respects:

```text
prefers-reduced-motion
```

When reduced motion is requested, decorative animation work is reduced or
disabled.

This provides both accessibility and performance benefits.

---

# 11. Layout Stability

Latest measured CLS:

```text
0
```

The current implementation therefore provides stable layout behavior for the
captured homepage Lighthouse run.

The project should continue to preserve:

* explicit image dimensions;
* stable content regions;
* predictable loading states;
* reserved layout space for dynamic content.

---

# 12. Image Strategy

The application should continue to prioritize:

* explicit image dimensions;
* appropriate image resolution;
* efficient formats;
* avoiding unnecessary above-the-fold image payloads;
* lazy loading for below-the-fold imagery where appropriate.

The current Lighthouse run passed the relevant image dimension and image
delivery checks required for the measured score.

---

# 13. JavaScript Strategy

Astro is used to keep client-side JavaScript limited to areas requiring
interactivity.

The application favors:

```text
HTML first
CSS second
JavaScript only where needed
```

This reduces initial client-side execution requirements.

Interactive behavior is provided by small bundled TypeScript modules
rather than a fully client-rendered application.

---

# 14. CSS Strategy

Tailwind CSS is used for the frontend visual system.

The application also contains global accessibility and visual utility styles.

Performance-sensitive UI avoids making decorative transitions a requirement for
content visibility.

---

# 15. Performance Quality Gates

Current performance requirements (production homepage, desktop and mobile):

```text
Lighthouse Performance   ≥ 90
LCP                      ≤ 2.5 s
CLS                      ≤ 0.1
```

All three are met: [metrics.md](metrics.md).

---

# 16. Remaining Performance Work

The current performance target has already been exceeded.

The remaining work is measurement and refinement rather than emergency
optimization.

## INP

Record a field INP value once real-user data is available (CrUX or Vercel
Speed Insights). Representative interactions:

```text
Navigation
Primary CTA interaction
Menu interaction
Project filter
```

## Mobile Lighthouse

Done on 2026-10-12 (median of 3 runs): see [metrics.md](metrics.md).

## TTFB

Repeated benchmarking done on 2026-10-12: 58–213 ms over six runs. Re-check
after backend or rendering changes.

---

# 17. Performance Regression Policy

A future performance regression should be investigated when one or more of
these conditions occurs:

```text
Lighthouse Performance < 90
LCP significantly exceeds 2.5s
CLS becomes > 0.1
large JS payload increase
large image payload increase
major TTFB regression
```

The exact threshold for TTFB should be established from repeated production
measurements rather than a single sample.

---

# 18. Recommended Measurement Process

For reproducible Lighthouse measurements:

```bash
# desktop
npx lighthouse https://aesoul0.com/ --preset=desktop --output=json \
  --output-path=./lighthouse-desktop.json --chrome-flags="--headless"

# mobile (the CLI default)
npx lighthouse https://aesoul0.com/ --output=json \
  --output-path=./lighthouse-mobile.json --chrome-flags="--headless"
```

Run each 2–3 times and use the median, because TTFB on Render/Vercel varies.
Report files (`lighthouse*.json`) are git-ignored.

Extract from each report:

```text
categories.<id>.score × 100             Performance, Accessibility,
                                        Best Practices, SEO
audits['largest-contentful-paint']      LCP
audits['cumulative-layout-shift']       CLS
audits['server-response-time']          TTFB
audits['total-blocking-time']           TBT
```

and update `docs/metrics-lighthouse.json`.

Record:

```text
Commit
Date
Environment
Route
Lighthouse version
Result
```

---

# 19. Performance Evidence

## Previous

```text
Performance: 88
LCP: 3.0s
CLS: 0
```

## After ISR

```text
Performance: 96
LCP: 2.2s
```

## Improvement from ISR

```text
Performance: +8 points
LCP: -0.8 seconds
```

## Current (2026-10-20)

See [metrics.md](metrics.md). The 2026-10 frontend changes (bundled scripts,
single particle canvas, hash-based CSP) raised mobile Performance from 90 to
95 on 2026-10-12 with no regression on desktop; the 2026-10-20 re-run gave 92
on mobile (see § 4).

---

# 20. Final Performance Position

CodeForge currently meets the roadmap performance target.

The current production homepage demonstrates:

Current numbers: see [metrics.md](metrics.md).

Mobile Lighthouse and repeated TTFB benchmarking were completed on
2026-10-12. The only remaining performance evidence gap is:

```text
Field INP measurement (requires real-user data)
```

No further speculative performance changes should be introduced unless fresh
measurements identify a concrete regression or bottleneck.

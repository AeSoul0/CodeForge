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

---

# 3. Lighthouse Results

## Current Measurement

Latest captured Lighthouse result:

| Metric         |      Result | Target | Status |
| -------------- | ----------: | -----: | ------ |
| Performance    |  **93/100** |   ≥ 90 | ✅ PASS |
| Accessibility  | **100/100** |   ≥ 90 | ✅ PASS |
| Best Practices | **100/100** |   ≥ 90 | ✅ PASS |
| SEO            | **100/100** |   ≥ 90 | ✅ PASS |

---

# 4. Core Performance Metrics

Latest captured homepage measurement:

| Metric                    |       Result | Interpretation              |
| ------------------------- | -----------: | --------------------------- |
| Largest Contentful Paint  |    **2.2 s** | ✅ Good                      |
| Cumulative Layout Shift   |        **0** | ✅ Excellent                 |
| Time to First Byte        |   **770 ms** | ⚠️ Optimization opportunity |
| Interaction to Next Paint | Not reported | ⚠️ Pending                  |

## LCP

Current:

```text
2.2 seconds
```

The result is below the roadmap target of 2.5 seconds for a strong production
experience.

## CLS

Current:

```text
0
```

This indicates no measurable layout-shift contribution in the captured run.

## TTFB

Current captured value:

```text
770 ms
```

TTFB remains an optimization opportunity.

However, TTFB varies between Lighthouse captures and should not be judged from
a single sample in isolation.

## INP

The captured Lighthouse JSON did not expose a reportable INP display value.

Therefore:

```text
INP: PENDING
```

No estimated INP value is published.

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

After ISR:

```text
Performance: 93/100
LCP:         2.2 s
```

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

Interactive behavior remains available through targeted React or browser-side
components rather than requiring a fully client-rendered application.

---

# 14. CSS Strategy

Tailwind CSS is used for the frontend visual system.

The application also contains global accessibility and visual utility styles.

Performance-sensitive UI avoids making decorative transitions a requirement for
content visibility.

---

# 15. Performance Quality Gates

Current performance requirements:

| Metric                    |          Required |   Current | Status |
| ------------------------- | ----------------: | --------: | ------ |
| Lighthouse Performance    |              ≥ 90 |    **93** | ✅      |
| Lighthouse Accessibility  |              ≥ 90 |   **100** | ✅      |
| Lighthouse Best Practices |              ≥ 90 |   **100** | ✅      |
| Lighthouse SEO            |              ≥ 90 |   **100** | ✅      |
| LCP                       | < 2.5 s preferred | **2.2 s** | ✅      |
| CLS                       |             < 0.1 |     **0** | ✅      |

---

# 16. Remaining Performance Work

The current performance target has already been exceeded.

The remaining work is measurement and refinement rather than emergency
optimization.

## INP

Capture a fresh INP measurement using a representative interaction flow.

Recommended interactions include:

```text
Navigation
Primary CTA interaction
Menu interaction
Admin login interaction
```

## Mobile Lighthouse

Run the homepage under mobile Lighthouse conditions and record:

```text
Performance
Accessibility
Best Practices
SEO
LCP
INP
CLS
TTFB
```

## TTFB

Continue monitoring TTFB across multiple production measurements.

The current:

```text
770 ms
```

should be treated as an optimization signal rather than a hard regression
because the previous captured run reported:

```text
680 ms
```

while overall Performance and LCP improved substantially after ISR.

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

```powershell
npx lighthouse https://www.aesoul0.com `
  --output json `
  --output-path .\lighthouse-home.json `
  --chrome-flags="--headless"
```

Extract:

```text
Performance
Accessibility
Best Practices
SEO
LCP
INP
CLS
TTFB
```

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

## Current

```text
Performance: 93
LCP: 2.2s
CLS: 0
```

## Improvement

```text
Performance: +8 points
LCP: -0.8 seconds
```

This is the current strongest measurable performance improvement in the
project.

---

# 20. Final Performance Position

CodeForge currently meets the roadmap performance target.

The current production homepage demonstrates:

```text
Performance:    93/100
Accessibility: 100/100
Best Practices: 100/100
SEO:            100/100

LCP: 2.2s
CLS: 0
```

The principal remaining performance evidence gaps are:

```text
INP measurement
Mobile Lighthouse measurement
Repeated TTFB benchmarking
```

No further speculative performance changes should be introduced unless fresh
measurements identify a concrete regression or bottleneck.

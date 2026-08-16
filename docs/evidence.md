# Engineering Evidence

CodeForge uses measurable checks where possible. This page deliberately separates **verified evidence** from claims that still need measurement.

## Verified on 16 August 2026

The latest GitHub Actions run on `main` showed:

- **Frontend CI:** lint ✅, typecheck ✅, Astro build ✅.
- **Backend CI:** lint ✅, typecheck ✅, build ✅.
- **Backend tests:** 2 passed, 4 failed, 3 skipped.
- **Dependency audit:** npm reported **7 vulnerabilities**: 1 moderate, 3 high, 3 critical.

The backend test failures are real and should not be hidden behind portfolio copy. The failing areas are test bootstrap/timeouts and an unintended compiled test file under `dist/`.

The next engineering task is to isolate application initialization from server startup, exclude test sources from production compilation, and then publish the resulting coverage numbers.

## Evidence targets

Once the test pipeline is green, publish:

| Signal | Evidence to publish |
| --- | --- |
| Tests | total passed / failed / skipped |
| Coverage | statements / branches / functions / lines |
| Accessibility | Lighthouse / axe results on the deployed site |
| Performance | Lighthouse / Core Web Vitals |
| Dependency health | current `npm audit` summary |

Do not claim WCAG 2.2 AA compliance or a performance score until the deployed application has been measured.
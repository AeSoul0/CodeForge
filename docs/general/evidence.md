# Engineering Evidence

CodeForge uses measurable checks where possible. This page deliberately separates **implemented controls**, **verified checks**, and **results that still require measurement**.

## Verified on 16 August 2026

The current repository configuration and latest local verification provide the following evidence:

* **Frontend CI:** configured to run linting, typechecking, and Astro production build.
* **Backend CI:** configured to run linting, typechecking, production build, and Vitest tests.
* **Typecheck:** passed with `npm run typecheck`.
* **Production build:** passed with `npm run build`.
* **Automated tests:** **7/7 tests passed** across **2 test files**.
* **Testing:** Vitest, Supertest, and V8 coverage tooling are configured in the backend.
* **Architecture:** backend application configuration is separated from HTTP server startup through `app.ts` and `index.ts`.
* **Security controls:** Helmet, CSP configuration, restricted CORS, rate limiting, JWT authentication, secure cookies, bcrypt password hashing, and environment-based secrets are implemented.
* **Dependency audit:** the latest local `npm audit` reported **0 vulnerabilities**.
* **JWT dependency:** upgraded to `@fastify/jwt` 10.2.2.
* **Swagger UI dependency:** upgraded to `@fastify/swagger-ui` 6.1.1.
* **Password hashing dependency:** upgraded to `bcrypt` 6.0.0.

The current test execution also produced non-blocking warnings:

* Vite reports a future configuration change concerning `configLoader: 'native'`.
* Mongoose reports that the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated in favor of `returnDocument: 'after'`.
* The AI documentation path logs an expected error during the project API test because no `OPENAI_API_KEY` or `GEMINI_API_KEY` is configured in the test environment. The test itself still passes.

These warnings do not cause the current test suite to fail.

## Evidence targets

The following metrics should be added when they are measured against the current build:

| Signal            | Evidence to publish                                |
| ----------------- | -------------------------------------------------- |
| Tests             | total passed / failed / skipped                    |
| Coverage          | statements / branches / functions / lines          |
| Accessibility     | Lighthouse / axe results on the deployed site      |
| Performance       | Lighthouse / Core Web Vitals                       |
| Dependency health | current `npm audit` summary and remediation status |
| CI                | latest successful workflow run and commit SHA      |

## Security dependency findings

The dependency vulnerabilities identified during the previous audit have been remediated.

### `fast-jwt`

The previous critical `fast-jwt` vulnerability was resolved by upgrading:

```bash
@fastify/jwt
```

to:

```text
10.2.2
```

The application passed the current typecheck, build, and test suite after the upgrade.

### `@fastify/static`

The previous high-severity vulnerability in `@fastify/static`, which was introduced transitively through `@fastify/swagger-ui`, was addressed by upgrading:

```bash
@fastify/swagger-ui
```

to:

```text
6.1.1
```

The current application verification completed successfully after the upgrade.

### `tar`

The previous critical `tar` vulnerability was removed from the dependency tree by upgrading:

```bash
bcrypt
```

to:

```text
6.0.0
```

The resulting dependency audit now reports:

```text
0 vulnerabilities
```

## Test verification

The latest local test execution completed successfully:

```text
Test Files  2 passed (2)
Tests       7 passed (7)
```

This is the current verified test result for the backend working tree.

For coverage:

```bash
npm run test:cov
```

Coverage percentages should only be published after running the coverage command against the current source tree.

## Accessibility verification

The implementation includes:

* Semantic HTML.
* ARIA attributes where appropriate.
* Focus handling.
* `prefers-reduced-motion` support.

These controls are implementation evidence, not proof of formal WCAG compliance.

Do not claim **WCAG 2.2 AA compliance** until the deployed application has been evaluated with automated and manual checks.

Recommended evidence:

* Lighthouse accessibility audit.
* axe checks.
* Keyboard-only navigation.
* Focus visibility verification.
* Reduced-motion verification.

## Performance verification

CodeForge uses Astro and a deliberately lightweight frontend architecture.

This supports a performance-oriented implementation, but it is not itself a performance measurement.

Publish performance metrics only after measuring the current deployed build.

Recommended evidence:

* Lighthouse performance score.
* Largest Contentful Paint.
* Cumulative Layout Shift.
* Interaction to Next Paint.
* Tested route.
* Test date.
* Test environment.

## Dependency health

The latest local audit reports:

| Severity  | Count |
| --------- | ----: |
| Moderate  |     0 |
| High      |     0 |
| Critical  |     0 |
| **Total** | **0** |

The current backend dependency tree therefore passes `npm audit` with no reported vulnerabilities.

The audit should be repeated after future dependency changes.

## Evidence policy

The project should distinguish between:

**Implemented**

A feature or security control exists in the repository.

**Verified**

A tool, CI workflow, or test has confirmed the expected behavior.

**Measured**

A numerical result has been generated against a specific build or deployment.

**Not yet verified**

The project contains the capability, but there is not yet enough current evidence to publish a numerical result or compliance claim.

This distinction keeps the portfolio technically credible and prevents implementation details from being presented as measured outcomes.

## Reproducibility

Whenever a numerical result is published, record:

```text
Commit:
Date:
Environment:
Command:
Result:
```

Example:

```text
Commit: <full SHA>
Date: <UTC date>
Environment: Node 22 / Ubuntu
Command: npm run test:cov
Result: <measured result>
```

## Current engineering position

CodeForge currently has:

* a passing backend typecheck;
* a passing production build;
* a passing automated test suite with **7/7 tests passed**;
* **0 dependency vulnerabilities** according to the latest local `npm audit`;
* documented CI verification;
* layered backend architecture;
* application security controls;
* automated testing and coverage infrastructure.

The remaining evidence work is focused on:

1. Generating fresh coverage results.
2. Verifying accessibility on the deployed application.
3. Measuring production performance and Core Web Vitals.
4. Correlating local verification with a successful GitHub Actions run on the corresponding commit.

The repository should continue to distinguish between **passing automated checks**, **implemented controls**, and **measured quality metrics**.

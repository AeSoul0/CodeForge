# Operations

How CodeForge behaves when something fails, and the procedures to back up,
restore, roll back and revoke sessions. Every behaviour listed under
"Verified by" is covered by an automated test or was exercised by hand on the
date given.

---

## 1. Monitoring

| Signal | Where | Notes |
|---|---|---|
| Liveness | `GET /live` (backend) | Always `200` while the process runs. |
| Readiness | `GET /ready` (backend) | `503 {"database":"disconnected"}` when MongoDB is down. |
| Request and error counters | `GET /metrics` (backend) | Request count, 5xx error count, 2xx/4xx/5xx breakdown, average latency, database state. In-memory, reset on restart. |
| Frontend health | `GET /api/health` (frontend) | Liveness of the Vercel deployment; suitable for an external uptime check. |
| Admin view | `/admin/dashboard/system` | Shows the probes, the counters and the error rate, with optional 30 s auto-refresh. |
| Logs | Render log stream | Structured JSON request logs (request id, status, timing) plus the audit log for every create, update and delete. Rejected CSRF and login attempts are logged as warnings. |

There is no external error tracker (Sentry or similar) and no alerting. Errors
are visible in the Render logs and in the 5xx counter. Adding a tracker is a
deliberate non-goal until traffic justifies it.

---

## 2. Behaviour when a dependency fails

| Failure | What users see | Verified by |
|---|---|---|
| Backend API down or returning 5xx | Homepage still renders, with a "Backend Connection Failed" panel in place of projects and experience. | `frontend/tests/render/pages.test.ts` ("renders the API error state"), `frontend/e2e/api-errors.spec.ts` |
| API down on a project page | `503` page saying the project service is unavailable; unknown slugs return `404`. | `pages.test.ts` ("returns 404 for unknown projects and 503 when the API fails") |
| API down while building the sitemap | `/sitemap.xml` still lists the static pages. | `pages.test.ts` ("still lists the static pages when the backend is down") |
| API down in the admin | The projects and experiences pages show "Failed to load …" in the table instead of breaking. | `frontend/tests/admin/projects.test.ts`, `experiences.test.ts` |
| MongoDB down | `/ready` returns `503`; the API returns errors, which the frontend handles as above. | `backend/tests/unit/healthController.test.ts` |
| OpenAI fails | Gemini is tried next (when `GEMINI_API_KEY` is set). | `backend/src/utils/ai.ts` (`generateDetailedDescription`); excluded from coverage, so this row is from code review, not a test. |
| Both AI providers fail, or no key is set | The project is saved anyway; the error is logged and the project page shows "Architectural analysis is being generated" until an admin presses **AI** to retry. | `pages.test.ts` ("shows the pending state while AI docs are generated") |
| Vercel deploy hook missing | A warning is logged and the save still succeeds; pages refresh within the 300 s ISR window. | `backend/tests/unit/vercel.test.ts` |

Public pages are cached by Vercel ISR for 300 seconds, so a short backend
outage is usually invisible to visitors who hit a cached page.

---

## 3. Backup and restore

### Command

```bash
cd backend
npm run db:backup -- dump backups/2026-10-20            # one EJSON file per collection + manifest.json
npm run db:backup -- restore backups/2026-10-20 --drop  # replace each collection with the dump
```

The command reads `MONGODB_URI` from `backend/.env`. It uses the MongoDB
driver bundled with Mongoose, so no extra tools are needed. Dumps are
canonical Extended JSON, which keeps ObjectIds, dates and binary data
(experience logos) exact. `backend/backups/` is git-ignored.

Without `--drop`, a restore into a database that still holds the same
documents fails on duplicate `_id`s instead of creating duplicates.

### Verified by

- `backend/tests/api/backup.test.ts` round-trips a document with an ObjectId,
  a date and binary data through the real test database. It also checks that
  a restore without `--drop` is refused.
- 2026-10-20: the CLI was run against a throwaway local database: dump,
  drop the database, restore. Counts and date types matched.

### Recommended routine

1. Before risky changes (migrations, bulk edits), run a dump against
   production and keep it outside the repository.
2. Check the Atlas cluster's own backup settings in the Atlas console. The
   free M0 tier has no automated cloud backups, so on that tier this command
   is the only backup.
3. Test a restore into a local or staging database, not production:
   `MONGODB_URI=mongodb://127.0.0.1:27017/codeforge_restore npm run db:backup -- restore <dir>`.

---

## 4. Deploy rollback

| Layer | How to roll back | Notes |
|---|---|---|
| Frontend (Vercel, project `code-forge-kr57`) | Deployments → previous production deployment → **Instant Rollback**. | No rebuild; takes seconds. Automatic deploys from `main` stay paused until you promote a new deployment. |
| Backend (Render) | Events → previous deploy → **Rollback**. | Redeploys that build. If a change only touched the start command, use **Clear build cache & deploy**, because Render otherwise reuses the old build artifact. |
| Either, through Git | `git revert <merge-commit>` on `main` and push. | Both platforms redeploy from `main`; CI runs first on the PR. |

Database changes are not rolled back by a deploy rollback. Take a dump
first (section 3) when a change alters stored data.

---

## 5. Session revocation

Sessions are JWTs (HS256, issuer and audience checked, 24 h expiry) in an
HttpOnly cookie. The server keeps no session list, so a token stays valid
until it expires.

| Need | Procedure | Effect |
|---|---|---|
| Normal sign-out | **Logout** in the admin. | Clears the cookie in that browser. A copied token would remain valid until expiry. |
| Revoke every session (lost device, suspected leak) | Change `JWT_SECRET` in the Render environment and redeploy. | Every existing token fails verification; all browsers are sent back to the login page. |
| Change the admin password | Change `ADMIN_API_KEY` in Render and redeploy. | `seedAdmin` rehashes it on boot. Combine with a new `JWT_SECRET` to also end open sessions. |

Per-token revocation (a denylist) is not implemented. For a single-admin site
the secret rotation above is the accepted approach.

---

## 6. Open verification items

| Item | Status |
|---|---|
| Keyboard-only navigation | Done 2026-10-20 on the homepage and the case study (production build): 24 and 4 tab stops in reading order, each with a visible focus indicator, no traps, and the skip link first. Automated keyboard checks also run in `frontend/e2e/keyboard.spec.ts`. |
| Screen reader | Done 2026-10-21. Accessibility-tree pass on production (home, case study, a project page, 404, admin login; desktop and mobile): language, title, one `h1`, landmarks, link and button names, image alternatives, form labels and tab order are correct, and axe reports no WCAG 2.2 AA violations. It found and fixed unnamed decorative icons, the case-study ASCII diagram being read symbol by symbol, and skipped heading levels (see [evidence.md § 13](evidence.md)). NVDA 2026.2 walkthrough done 2026-10-21 with Chrome on the same pages: headings (H), Tab order, project filters, the architecture diagram and the login form were listened to, and the fixes it led to are in evidence.md § 13. |
| Field performance (INP from real users) | Pending until CrUX has enough traffic for aesoul0.com; lab INP is in [performance.md](performance.md#inp). |
| Independent security review | Pending. Automated coverage today: CodeQL, `npm audit`, Dependabot, and the API security tests in `backend/tests/api/security.test.ts`. A reviewer should start from [security.md § 27](security.md#27-security-review-checklist). |

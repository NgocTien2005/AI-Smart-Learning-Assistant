# Verified portfolio audit — 2026-11-09

Baseline: clean working tree on `main`, commit `68bde8594af3a5704db1b80adbbc220ecb9eb397`.
Fetched `origin/main` matches. No tracked changes existed to preserve. Discovery
used AGENTS.md, constitution1.0.0, development workflow, README, specs001–012,
acceptance reports, package/lockfiles, Prisma, runtime/configuration and tests.
Spec Kit1.2.3 resolver selected012; Git branch is not feature state. Hooks absent.

## Evidence and existing capabilities

- Production: `backend/server.js` → `backend/src/app.js`; `backend/app.js` is a
  separate legacy auth harness. React router → SessionContext/API → production
  routes → current-user middleware → Prisma/PostgreSQL and protected uploads.
- Two npm packages; React19, Vite8, Express5, Prisma7.10, PostgreSQL17; CI/Docker
  Node24. Lockfiles are retained. No dependency upgrades are part of this audit.
- [Exact baseline hosted run](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42651910401)
  succeeded for all three jobs. This is historical evidence, not a result for
  future branches. CI includes isolated LMS and complete-demo HTTP/database tests.
- 001–007:175 verified tasks with acceptance continuation reports;008:25/26,
  009:18/18,010:16/17,011:16/16,012:12/13. Early “pending” sections in old reports
  must be read with their later dated acceptance continuations.
- Preserve008T023 user-attested mailbox/reset acceptance.008T026 remains blocked
  by automatic approval review; no alternate profile deletion.010T016 real
  Google and012T012 real Gemini acceptance remain separate, open gates.
- The demo contains18 synthetic accounts,8 courses,48 lessons,26 documents and24
  assignments. Its create-only ledger and target guards preserve existing users.
  An explicit local operator password override is historical dev data, not a
  production credential recommendation. No reseed/reset was performed by audit.

## Reproduction method

`node .artifacts/portfolio-audit-20261109/probe.mjs`, repository root, exit0.
Real production app, ephemeral loopback server, deliberately unreachable synthetic
database configuration; selected requests require zero database queries. No
email, Google, Gemini, account mutation or existing Docker resource was touched.
Sanitized results below are sufficient to reproduce without private evidence.

## Confirmed defects and security gaps

| ID / severity | Files and actual evidence | Cause | Proposed solution | Regression risks | Acceptance criteria / required tests |
| --- | --- | --- | --- | --- | --- |
| AUD01 Medium | `backend/src/routes/auth.js`: POST login/register/forgot/reset without body each returned500 | Destructuring undefined body; route assumes object | Reject absent/non-object JSON mutations at production boundary | Multipart uploads, valid optional fields, existing400 contracts | All four malformed requests400; arrays/null/scalars rejected; valid password spaces unchanged; production route tests |
| AUD02 High | `auth.js`: no login/register guard;25 invalid login requests all400, no429; valid-password path invokes bcrypt/DB without throttle | Missing credential-abuse controls; probe demonstrates absent limiter, not a successful brute force attack | Bounded per-IP budgets before expensive work; join-code/user and recovery budgets; safe429/Retry-After | Shared Nginx address; integration creates many fixtures; spoofed forwarding headers | Threshold/expiry/capacity/spoof tests, correct roles/password/reset still pass; isolated stack integration |
| AUD03 Medium | `auth.js` forgot limiter Map keyed IP+email, scans expiry but has no maximum entries | Rotating email bypasses aggregate IP limit and grows memory within window | Independent IP budget plus bounded hashed IP/email budget; fail closed at capacity | Avoid account-only lockout and email enumeration | Rotating-email limits, expiry/capacity tests; generic response unchanged below limit |
| AUD04 Low | Production GET health200 exposes X-Powered-By; no nosniff/referrer-policy; `frontend/nginx.conf` lacks such headers | Defaults/no explicit baseline headers | Disable framework banner; safe API/static nosniff and referrer policy; document CSP separately | Google GIS, blob document preview, reset-link referrer leakage | Headers on success/error; real Nginx responses; don't invent a broad CSP that breaks GIS |
| AUD05 Medium | `backend/test/auth.test.js` imports `../app.js`; `server.js` imports `./src/app.js` | Duplicate auth implementations and divergent tests | Move auth tests to injectable production router/middleware; retire legacy only after reference check | Password reset races/revocation, role routing and response mapping | Production login/register/me/revocation/expired tokens, malformed body and abuse regressions; retain behavioral assertions |

## Confirmed maintainability gaps / recommendations

These are source-backed recommendations, not reproduced user-facing failures.

| ID / severity | Files / evidence | Root cause or hypothesis | Proposed solution | Regression risks | Acceptance criteria / required tests |
| --- | --- | --- | --- | --- | --- |
| AUD06 Medium | `backend/src/routes/courses.js`750 lines covers courses, assignments, progress, documents, study | Several responsibilities share one module | Extract assignment/lesson routers and common course/file helpers without changing paths | Mount ordering, authentication, upload cleanup, owner/enrollment | Existing API/DB integration and quiz regressions unchanged; denied writes still leave no changes |
| AUD07 Medium | `CourseWorkspacePage.jsx`435 lines; `AssignmentsPanel.jsx`265 dense lines; frontend test file mixes many features | State, request lifecycle and presentation coupled | Extract cohesive roster/clock/form logic; split tests by feature with shared fixtures | Stale reads, retained drafts, StrictMode cleanup, quiz flush | Existing component assertions preserved; async/navigation cases; full frontend checks |
| AUD08 Low | `ConfirmDialog.jsx` handles Escape keydown and native cancel without suppressing native keydown behavior | Potential duplicate cancel callback in native dialog; needs real-browser reproduction before classifying defect | Single native cancel path, unique accessible IDs; reduced-motion support | Keyboard/focus restoration across dialogs | Native Escape once, Tab cycle/focus restore; component regression and1280×800/1440×900 browser;390px responsive survey |
| AUD09 Medium | `demoCloudAssistant.js` validates exact excerpts but not factual entailment; controlled tests only | Citation validity cannot establish semantic correctness | Versioned synthetic evaluation cases, insufficient-context/injection/output tests; actual provider gate stays012T012 | Misleading evaluation claims, unintended external data | Reproducible offline cases clearly labeled; no private/provider calls in CI; real-model results reported separately |
| AUD10 Medium | `docs/production-readiness.md`: backups/restore/TLS/monitoring/release unverified; Docker runs backend as default root | Local development foundations, no deployment evidence | Non-root app after upload ownership validation; safe headers, operator backup/restore/release runbook | Existing named-volume permissions, startup migration | Isolated rebuilt stack/migration/upload pass; no existing dev volume mutation; restore remains unverified until separate drill |
| AUD11 Low | README opening says no external AI while final section describes optional Gemini; missing recruiter architecture/interview/demo docs | Documentation accumulated across features | Consistent capability matrix, ERD, threat model, role demo, honest evidence/limits | Overstating deployment/Google/model capability | Link checks, source/contract review; no fabricated screenshots/performance/deployed URLs |

No Critical defect or confirmed cross-user disclosure was demonstrated by this
audit. This statement is limited to inspected code and tests; it is not a
penetration-test certification. Dependency/image advisory review is still needed
before any public release. Authentication storage remains an explicit XSS risk
assessment; cookie migration must not be bundled into rate limiting.

## Dependency-ordered roadmap and Git strategy

1. Audit/specification branch `portfolio/00-audit-speckit`, PR base `main`.
2. P0 B: `security/auth-hardening`, bounded abuse controls and malformed input,
   production auth tests, threat model. This is the first safe implementation.
3. P1 A: `refactor/architecture-cleanup`, API-preserving modules/hooks; keep
   security work separate. E test split can follow A where it depends on factories.
4. P1 E: `test/quality-ci`, production coverage and explicit CI/evidence gates.
5. P1 D: `feat/ai-quality-improvements`, offline reproducible evaluation and
   privacy/output regressions; real model acceptance stays012T012.
6. P2 C: `refactor/frontend-ux`, targeted native-dialog/accessibility/responsive
   issues established by review and browser; preserve visual identity.
7. P2 F: `docs/portfolio-readiness`, recruiter docs and role-based demo.
8. P2 G: `chore/deployment-foundations`, safe operating documentation/config.

Each independent branch starts at the verified audit branch while its audit PR
is unmerged; its intended PR base is `portfolio/00-audit-speckit`. This dependency
is documentation only and explicitly temporary. If combined validation is
needed, use a named temporary integration branch with the exact included commits;
never update/merge main automatically. Allocate feature IDs only with the official
create script; branch names do not select features. No duplicate tasks for the
three existing acceptance blockers. Separate changes, test, commit and PR per group.

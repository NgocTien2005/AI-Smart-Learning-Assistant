# Verification — auth abuse hardening

2026-11-09. Branch `security/auth-hardening`, intended PR base
`portfolio/00-audit-speckit` (audit documentation dependency, not another code
feature). Baseline2891c11; source manifest identifies uncommitted tested files.
No existing data/dev backend/private configuration or local8081 resource changed.

## Workflow and read-only analysis

Official create script allocated014, setup-plan/setup-tasks/prerequisite template
commands exit0; Specify1.2.3. Hooks absent at each step. Specify/clarify: all scope,
privacy/data/compatibility categories clear; no user question required. Plan
research used primary Express/OWASP sources and independent read-only research.
Custom checklist generated unchecked, separately reviewed under user's explicit
authorization;6/6 review and5/5 spec-quality items satisfied before implement.
Checklist markers remained read-only during implement.

Analyze used `SPECIFY_FEATURE_NO_PERSIST=1` and required spec/tasks flags, read-only:
6FR+3SC covered by7tasks; no duplication, ambiguity, unmapped task or
CRITICAL/HIGH finding. No schema, dependency or success contract change. Detailed
bodyless-command behavior refined during implementation documentation: missing
body is normalized for progress/process, required auth fields reject400. This
preserves existing valid bodyless commands rather than breaking them globally.

## Actual commands and outcomes

| Command | Cwd | Exit | Outcome |
| --- | --- | --- | --- |
| node --test test/auth.test.js | backend |0 | Ported original7 assertions to production;8 tests pass |
| node --test test/requestBoundary.test.js, before guard | backend |1 | Expected regression red: absent login body500 instead of400 |
| node --test test/auth.test.js test/rateLimit.test.js test/requestBoundary.test.js | backend |0 |17 tests pass incl nested original auth assertions |
| node scripts/ci/check-package.mjs backend | root |0 | npm ci, full backend, quiz filter and23CI-safety regressions all exit0 |
| npx prisma validate | backend |1 then0 | Initial invocation overlapped npm ci and failed missing module; serialized rerun passed; no version upgrade |
| node scripts/ci/integration.mjs | root |0 | Built/healthy fresh project, actual HTTP/database identity and migration status verified;90HTTP operations,33 resources |
| git diff --check | root |0 | No whitespace errors |

Tooling attempts preserved: unavailable Python writer during013 and one malformed
PowerShell quoting command made no changes; initial auth test invocation from root
used wrong relative path and exited1, then correct backend cwd passed. No required
test was disabled or its failure hidden. Node host25.2.0; CI uses24.

## Acceptance traceability

| Source | Tasks | Evidence |
| --- | --- | --- |
| FR-001,SC-001,US1-AC1 |T003/T004 | Production app absent/array/null/scalar/malformed400, oversized413; no DB access needed |
| FR-002,SC-002,US1-AC2/3 |T003/T004 | Thresholds, expiry, full cardinality fail closed, normalized/rotating emails, forged forwarding headers, all budgets; rejected-work counter unchanged |
| FR-003,US2-AC1/2/3 |T005 | Three roles, public ADMIN denied, wrong password/space preservation, missing/invalid/expired/revoked/inactive tokens, exact public mapper; concurrent reset200/400, old password/session401, used link400 distinct from validation400; generic forgot and no-config503 |
| FR-004,SC-003 |T002/T005/T006 | Original assertions now production router/middleware; isolated real DB/API90 operations |
| FR-005 |T003/T004/T005 | Banner removed; no-store/nosniff/no-referrer on errors/success; safe exception code-only log regression |
| FR-006 |T001/T006 | docs/security.md + research: proxy/shared-IP limits, storage XSS risk, future cookie migration/CSRF tradeoffs |
| SC-003 publication |T007 | Exact Git/hosted evidence recorded after push |

## Cleanup and limits

Project `lumina-acceptance-ci-1794241912442-250398f1`, HTTP loopback56238,
database `lumina_acceptance`. Harness verified actual backend connection before
provisioning. All owned users removed, zero remaining; containers/network stopped
with scoped compose down. Two named volumes retained, no volume deletion:
`lumina-acceptance-ci-1794241912442-250398f1_postgres_data` and
`lumina-acceptance-ci-1794241912442-250398f1_uploads_data`.

No SMTP/Google/Gemini request, browser/profile operation or dev backend recreate.
Frontend unchanged, so no unrelated browser/full frontend checks locally.
Historical008T023 preserved;008T026/010T016/012T012 remain open. Current controls
are per-process and Nginx users share IP budget; no public-load/penetration-test
or production-readiness claim. Legacy app remains temporarily unreferenced by
tests/runtime; retirement belongs to architecture feature.

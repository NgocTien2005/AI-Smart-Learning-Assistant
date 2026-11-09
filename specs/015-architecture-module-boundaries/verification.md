# Verification — architecture boundaries

2026-11-09, branch refactor/architecture-cleanup, base2891c11 audit branch.
Independent of security014; intended PR base portfolio/00-audit-speckit.
Production entrypoint/authentication/resource contracts preserved; no API/schema,
dependency, DOM/CSS/layout or existing data mutation.

## Workflow and traceability

Official script allocated015 before branch switch; resolver then used015, not
Git branch inference. Specify/clarify all categories clear, no question needed.
Plan/setup-tasks/checklist prerequisites exit0; hooks absent. Checklist generated
unchecked, separately authorized review4/4 and requirements5/5 before implement;
markers frozen. Read-only analyze/no-persist:5FR+3SC covered by6tasks; no unmapped,
duplicate, ambiguous or CRITICAL/HIGH finding. No artifacts/state written by analyze.

| Source | Tasks | Evidence |
| --- | --- | --- |
| FR-001/002,US1-AC1/2,SC-001 |T002/T003 |25 normalized handler blocks unchanged:8 course,5 assignment,12 lesson/progress; common predicates/function extraction; actual LMS90operations and seeded247HTTPoperations |
| FR-003,US2-AC1/2,SC-002 |T004 | Roster effect/abort/active lifecycle and assignment form/StudentEditor extraction; full component suite226pass +5Node service tests, lint/build; true Chrome20views |
| FR-004,SC-003 |T001 | Executable reference scan: auth.test.js still references legacy on this branch; retained rather than silently deleting or stacking014 |
| FR-005,SC-003 |T005/T006 | docs/module-boundaries.md; source manifest, sanitized summaries and actual Git/PR evidence below |

## Actual checks

Commands cwd root unless stated; all exit codes retained in safe summaries.

- `node scripts/ci/check-package.mjs backend`: exit0; npm ci/full tests/quiz
  regression/23CI-safety checks all0. Production handler import also succeeds
  on host and rebuilt Node24 image with synthetic configuration/no DB access.
- Initial `node scripts/ci/check-package.mjs frontend`: npm ci0, tests1,
  lint0/build0. Extraction initially removed FieldError import still used by
  grading; restored it. Fresh `npm test`, cwd frontend, exit0:226 component tests
  plus5Node tests. No assertions removed. Initial failed summary retained.
- Initial `node scripts/ci/integration.mjs`: stack startup exited1 after wait;
  no target provisioning; own containers/network cleaned successfully. Cause
  not established from suppressed raw output. This is not attributed to an app
  bug. Import probe0; subsequent fresh project passed. A Docker stdin diagnostic
  first hit PowerShell argument quoting syntax1, then safe stdin probe0.
- Fresh integration via ignored wrapper of the same harness with safe boolean
  diagnostics: exit0, Docker build/healthy0, actual backend DB/migration status0,
  test:integration0, scoped down0.90operations/33resources, owned users0.
- Existing seed/browser harness with only unique evidence-directory override:
  exit0, separate healthy stack/actual DB verified,247HTTPoperations, create-only
  dry-run/collision/rerun/sentinel and changed-source denial pass.
- Actual Chrome headless engine, fresh run-owned OS-temp profile:20views across
  ADMIN/INSTRUCTOR/STUDENT at1280×800 and1440×900; DOM viewport matches, no page
  horizontal overflow. Roster, lessons, assignments, dashboards and disabled-cloud
  panel observed. Representative roster/assignment captures visually inspected.
  Screenshots remain ignored; no existing user/profile was inspected or removed.

## Cleanup and limits

Successful LMS project lumina-acceptance-ci-1794242641573-c0820f0e, loopback57421;
seed/browser project lumina-acceptance-ci-demo-1794242694656-b3d3ae, loopback56307.
Both actual DB lumina_acceptance verified before provisioning; owned users0,
containers/network stopped. Each retains postgres_data/uploads_data volumes;
seed volume retains26 synthetic documents. First startup-failed project
lumina-acceptance-ci-1794242258608-fbef2dce also stopped; its volumes retained.
No volume deletion, local8081 access or private dev backend recreation.

Zero real provider/email requests; old008T023 evidence unchanged;
008T026/010T016/012T012 remain in original features. This branch alone does not
include014 security fixes; combined validation must name included commits.

Prisma validate, cwd backend, serialized after npm ci with synthetic URL/empty dotenv path: exit0. git diff --check0. No schema delta.

## Actual review/hosted CI and convergence

Commits86f96c9 (server),bd2bdf8 (frontend),45a31b1 (evidence) pushed separately. PR [7](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/7), base portfolio/00-audit-speckit. Actual [run42658427628](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42658427628) at45a31b165e20fdc6cdd2f5c4a117689a8c54e26c passed Frontend, Backend, HTTP/database integration. T006 closed from actual results; later evidence-only commit has a separate run.

Final read-only analyze5FR/3SC covered by6tasks, no critical/high/unmapped issue. Converge checked5FR/3SC/4AC, named boundaries and five constitution principles: no new gap, tasks byte-identical during converge; legacy retirement is an explicit compatibility dependency on014, not silently claimed complete. Checklist markers unchanged, no duplicate provider/cleanup task. No merge/main/deploy.

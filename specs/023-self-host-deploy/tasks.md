# Tasks: Self-host deployment kit

## Setup
- [x] T001 P1 Review spec/clarifications/primary-source plan/checklist and read-only analysis in specs/023-self-host-deploy; FR001-006 mapped, no unresolved implementation choice.

## US1 - reproducible host configuration
- [x] T002 [US1] P1 Implement compose.web.yaml, deploy/web.env.example, deploy/Caddyfile.example and synthetic scripts/ci/test/web-deploy.test.mjs; wire into scripts/ci/check-package.mjs backend CI gate; depends T001; FR001/002/005; deliver exclusive loopback18080, HTTPS origins and demo disabled; verify positive/negative merged config with synthetic env, no daemon/secret output.

## US2 - safe bootstrap and operator guide
- [x] T003 [US2] P0 Fix reproduced bootstrap email regex in backend/scripts/create-admin.mjs through narrow utils/adminBootstrap.js validation, cover test/adminBootstrap.test.js; depends T001; FR004; accept ordinary emails, reject malformed/invalid fields, preserve12-72 untrimmed password and normalized email; backend/quiz pass without real DB mutations.
- [x] T004 [US2] P1 Write docs/deploy-vps.md and docs/release-status-20261117.md; update README.md/docs/operations.md and production-readiness links; depends T002/T003; FR003/006; deliver exact Linux deployment/admin/Gemini/update/backup path and honest blocker inventory; verify commands/static links and no secrets or false public readiness.

## Verification/handoff
- [ ] T005 P1 Validate actual new web stack build/health, Caddy configuration and HTTPS/domain plus three-role/storage/provider staging acceptance; depends T002-004 and operator Docker/domain/host; SC002/003. Keep open if unavailable; no deploy authorization inferred. Evidence in specs/023-self-host-deploy/verification.md.
- [x] T006 P1 Record local checks/traceability, read-only analyze, append-only converge and small local commits in specs/023-self-host-deploy/verification.md; depends T002-004; FR006/SC001/003; exact hosted/remote status separate, no duplicate blocker tasks.

## Dependencies

T001 -> T002/T003 -> T004 -> T005/T006. Config and narrow bootstrap are disjoint; implement sequentially. MVP is a validated operator kit, not a claimed live deployment. Keep008/010/012/021 historical blockers in their features. No additional worker beyond mandatory plan research.

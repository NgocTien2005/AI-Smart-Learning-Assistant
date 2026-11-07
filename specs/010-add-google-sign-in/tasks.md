# Tasks: Existing-account Google sign-in

**Input**: [spec](spec.md), [plan](plan.md), research/data-model/contracts/quickstart.
**Tests**: Required by FR-010/SC-004 and Lumina constitution. Fixture tests do not close real-provider acceptance.

## Phase 1: Setup

- [x] T001 Record baseline, official resolver/hook checks and source trace in verification.md; preserve 008/009 ownership (FR-010/011).
- [x] T002 Review checklists/security.md separately with cited requirements before implement; analyze read-only (FR-001–011).

## Phase 2: Foundation

- [x] T003 Write failing nonce/JWT/challenge regressions in backend/test/googleIdentity.test.js; implement bounded provider verification in backend/src/services/googleIdentity.js (FR-003/008).
- [x] T004 Add nullable unique `googleSubject String? @unique` with nonempty subject up to 255 characters validation to backend/prisma/schema.prisma and a new migration only; validate/generate/review SQL (FR-001/002).

## Phase 3: US1 — deliberate linking (P1)

Independent test: matching active owner links; missing/stale session, mismatch, occupied link and concurrent claims cause no unauthorized write.

- [x] T005 [US1] Add failing production-router fixture regressions in backend/test/googleAuth.test.js for link ownership/email/unique/race/version boundaries (FR-002/003/004).
- [x] T006 [US1] Implement authenticated challenge/link/status in backend/src/routes/googleAuth.js, mount from backend/src/app.js using existing middleware/public mapper (FR-002/003/004).
- [x] T007 [US1] Add Account linking/status/recovery in frontend/src/components/account/GoogleLinkPanel.jsx and frontend/src/pages/AccountPage.jsx; share operation gate and session lifetime (FR-002/006/007/008).

## Phase 4: US2 — linked sign-in (P1)

Independent test: all three linked roles enter their original account; unknown/unlinked/disabled/replayed identity creates zero users/sessions.

- [x] T008 [US2] Add backend/test/googleAuth.test.js login denials/role preservation tests, then stable-subject-only login to backend/src/routes/googleAuth.js; no user.create/email lookup (FR-001/003/004/005).
- [x] T009 [US2] Implement hosted GIS loader and scoped official button in frontend/src/services/googleIdentity.js and frontend/src/components/GoogleIdentityButton.jsx; no token storage/One Tap (FR-003/006/008).
- [x] T010 [US2] Integrate Google into frontend/src/pages/AuthPage.jsx through existing SessionContext, pending gate, /me continuation and routing; preserve password registration/reset (FR-005/006/007).
- [x] T011 [US2] Add component regressions in frontend/src/__tests__/googleAuth.test.jsx for optional state, login/link contract, stale callbacks, no automatic retry and existing role verification (FR-001/002/005/006/008).

## Phase 5: US3 — configuration (P2)

Independent test: no client configuration gives honest unavailable/503 while password flows operate; public ID can be supplied consistently.

- [x] T012 [US3] Add public client ID plumbing to compose.yaml, frontend/Dockerfile and example configuration; write docs/google-sign-in.md and update README/AGENTS/frontend README dev connection guidance (FR-008/009/011).

## Phase 6: Verification and handoff

- [x] T013 Run full frontend test/lint/build and backend tests/quiz; record cwd/command/exit in verification.md (FR-004/005/010, SC-001/002/004).
- [x] T014 Build isolated acceptance stack, verify actual HTTP/database target, migration deploy/status and integration; record owned cleanup in verification.md; never local8081 (FR-001–005/010/011).
- [x] T015 Inspect real browser at 1280×800/1440×900, auth optional state/layout/keyboard; record precise observed scope in verification.md (FR-007, SC-003).
- [ ] T016 Execute real Google linking/login acceptance after private client configuration with user-operated Google UI; record original account/roles, rejected unlinked identity and preserved password access in verification.md (FR-001/002/004/010, SC-001/002/004).
- [x] T017 Update traceability.md, verification.md, docs/production-readiness.md and README; final read-only analyze, append-only converge, feature-scoped commits/normal push and distinguish actual hosted run (FR-010).

## Dependencies & execution

T001 → T002 → T003/T004 → T005 → T006 → T007; T008 depends on T003/004/006. T009 → T010/007 → T011. T012 follows contracts and can be edited independently of backend tests. T013/014/015 follow implementation; T016 additionally requires private client setup. T017 records completed and blocked results without claiming T016 passed.

Parallel opportunities (no agents required): independent test files after foundation, and documentation T012 alongside backend implementation. US1 is the first independent slice; US2 uses its link model but can test existing seeded fixture links. No deploy checkpoint is authorized. Existing 008 T026 remains solely in feature008.

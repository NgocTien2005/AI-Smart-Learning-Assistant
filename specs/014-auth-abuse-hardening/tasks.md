# Tasks: Auth abuse hardening

## Phase 1: Setup

- [x] T001 P0 Record baseline/research and contract in verification.md (FR-006; deliverable threat/proxy decision; verify primary-source review; depends:none).

## Phase 2: Foundation

- [x] T002 P0 Introduce real auth/current-user factories in backend/src/routes/auth.js and backend/src/middleware/authenticateFactory.js; port backend/test/auth.test.js off legacy (FR-004; deliverable same production handlers; verify existing behavior and reference scan; depends:T001).

## Phase 3: US1 — safe rejection (P1)

- [x] T003 [US1] P0 Add threshold/expiry/capacity/rotating-email/spoof tests in backend/test/rateLimit.test.js and backend/test/requestBoundary.test.js before guards (FR-001/002/005,SC-001/002; deliverable reproducible red→green cases; verify before/after; depends:T002).
- [x] T004 [US1] P0 Implement bounded middleware and mount production budgets/body/header/error guards in backend/src/middleware/, backend/src/app.js, backend/src/routes/{auth,courses}.js (FR-001/002/005; deliverable safe400/413/429 and redacted errors; verify T003 plus actual integration; depends:T003).

## Phase 4: US2 — compatibility (P1)

- [x] T005 [US2] P0 Extend backend/test/auth.test.js with all roles, current identity/revocation, spaces, atomic used reset and generic forgot tests (FR-003/004,SC-003; deliverable production auth regression; verify full backend/quiz; depends:T004).

## Phase 5: Verification and review

- [x] T006 P1 Write docs/security.md and verification.md with threat model, cookie tradeoffs, limits and scoped command outcomes (FR-006,SC-001/002/003; deliverable truthful handoff; verify Prisma/isolated HTTP+actualDB and diff; depends:T005).
- [x] T007 P1 Commit scoped changes, push branch and create PR; record exact hosted result in verification.md (SC-003; deliverable review; verify SHA/jobs, not inferred; depends:T006).

## Dependencies and implementation strategy

T001→T002→T003→T004→T005→T006→T007. No parallel writes; clock-based limit tests
can be read/reviewed independently of documentation. US1 is immediate protection,
US2 preserves authentication. Existing provider/cleanup gates stay in008/010/012.
PR base portfolio/00-audit-speckit; code independent of later workstreams.

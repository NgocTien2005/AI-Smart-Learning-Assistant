# Tasks: Test organization

## Phase 1: Setup

- [x] T001 P1 Inventory frontend/src/__tests__/frontend.test.js statements/variants and baseline226 component tests in verification.md (FR-002,SC-001; deliverable comparison; verify AST/hash inventory; depends:none).

## Phase 2: Foundation

- [x] T002 P1 Extract imports/helpers/cleanup into frontend/src/__tests__/fixtures.js (FR-001/002; deliverable reusable synthetic fixtures; verify no mutable cross-file dependence; depends:T001).

## Phase 3: US1 — feature modules (P1)

- [x] T003 [US1] P1 Split frontend/src/__tests__/{authEntry,session,dashboard,workspace,assignments,quiz,documentStudy,account,admin}.test.js and remove original only after equality check (FR-001/002,SC-001; deliverable unchanged assertions; verify standalone/full suite and count; depends:T002).

## Phase 4: US2 — CI trust (P1)

- [x] T004 [US2] P1 Update docs/continuous-integration.md coverage map and verify existing package/CI discovery plus full lint/build/backend/quiz/safety (FR-003/004,SC-002; deliverable explicit production/provider limits; verify commands and source references; depends:T003).

## Phase 5: Review

- [x] T005 P1 Record verification.md, small commits, push/PR and actual hosted SHA (SC-001/002; deliverable reviewable isolated branch; verify Git/CI and no weakened gate; depends:T004).

## Dependencies and strategy

T001→T002→T003→T004→T005; no parallel writes to shared test fixture. US1 useful
minimum, US2 records actual CI compatibility. No production/security code stacked.

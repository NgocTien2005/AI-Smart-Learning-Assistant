# Tasks: Course module boundaries

## Phase 1: Setup

- [x] T001 P1 Record handler/import inventory and legacy reference decision in verification.md (FR-004/005,SC-003; deliverable source map; verify references and baseline; depends:none).

## Phase 2: Foundation

- [x] T002 P1 Extract common access/storage/progress helpers to backend/src/utils/courseAccess.js and backend/src/services/{courseDocuments,courseProgress}.js (FR-002; deliverable unchanged predicates; verify normalized function equality and backend regressions; depends:T001).

## Phase 3: US1 — server boundaries (P1)

- [x] T003 [US1] P1 Separate backend/src/routes/{assignments,lessons}.js from courses.js and compose after authentication (FR-001/002,SC-001; deliverable identical method/path/handlers; verify normalized block equality plus real HTTP/DB permissions/upload/grading/quiz; depends:T002).

## Phase 4: US2 — frontend boundaries (P1)

- [x] T004 [US2] P1 Extract frontend/src/hooks/useCourseRoster.js, services/assignmentForm.js and components/assignments/StudentEditor.jsx; simplify corresponding page/panel imports (FR-003,SC-002; deliverable same behavior; verify full frontend suite/lint/build and browser matrix; depends:T001).

## Phase 5: Verify/review

- [x] T005 P1 Record commands/traceability/browser/scoped cleanup and module guide in verification.md (FR-005,SC-001/002/003; deliverable verified boundaries; verify actual suites/DB/Chrome and diff; depends:T003/T004).
- [x] T006 P1 Create small feature commits, push and PR against portfolio/00-audit-speckit; record hosted result in verification.md (SC-003; deliverable reviewable branch; verify exact SHA/PR; depends:T005).

## Dependencies and implementation strategy

T001→T002→T003; T004 independent afterT001; T005 joins, thenT006. T003 andT004
touch separate packages but may be executed sequentially to keep review small.
US1 MVP is server separation; US2 preserves frontend workflows. Legacy retirement
awaits014 integration, not counted as completed removal.

# Tasks: Responsive accessibility

## Phase 1: Setup

- [x] T001 P1 Capture actual auth baseline and role/source survey in verification.md (FR-001/004,SC-001; deliverable measured390px defect; verify real Chrome geometry/capture; depends:none).

## Phase 2: Foundation

- [x] T002 P1 Define targeted viewport/motion acceptance in plan.md and verification.md (FR-001/002/003; deliverable bounded design; verify desktop identity/no behavior change; depends:T001).

## Phase 3: US1 — usable narrow auth (P1)

- [x] T003 [US1] P1 Add narrow auth overrides in frontend/src/pages/AuthEntry.css preserving controls/desktop (FR-001/002,SC-001; deliverable readable one column; verify actual390/768/1280/1440 geometry and full frontend suite; depends:T002).

## Phase 4: US2 — accessible learning (P1)

- [x] T004 [US2] P1 Add scoped reduced-motion rules in frontend/src/App.css and pages/{LearningApp,AuthEntry}.css; fix reproduced narrow header/assignment overflow in pages/LearningApp.css and components/AssignmentsPanel.css; verify role states/keyboard and unchanged guards (FR-003/004,SC-002; deliverable preference and all controls retained; verify computed browser style/status, no page overflow and real role matrix; depends:T002).

## Phase 5: Verify/review

- [x] T005 P1 Record full frontend/isolated Chrome/cleanup, commit/push/PR and hosted SHA in verification.md (SC-001/002; deliverable truthful review; verify all commands and exact source; depends:T003/T004).

## Dependencies and strategy

T001→T002→{T003,T004}→T005; CSS files overlap, execute serially. All role workflow
behavior remains backed by existing component tests; only reproduced responsive
defect and explicit preference improvement get code changes. No fake provider UI.

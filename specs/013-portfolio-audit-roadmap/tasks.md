# Tasks: Portfolio audit

## Phase 1: Setup

- [x] T001 P0 Capture baseline and official resolver in verification.md (FR-001; deliverable revision/status; verify Git/prerequisite output; dependency:none).

## Phase 2: Foundation

- [x] T002 P0 Inspect instructions, artifacts001–012 and production source in docs/portfolio-audit.md (FR-001; inventory; verify references; depends:T001).

## Phase 3: US1 — evidence (P1)

- [x] T003 [US1] P0 Reproduce input errors and record complete findings in docs/portfolio-audit.md (FR-002,SC-001; tables; verify probe exit0/no DB queries and all fields; depends:T002).

## Phase 4: US2 — roadmap (P1)

- [x] T004 [US2] P1 Document A–G priorities/dependencies/Git strategy in docs/portfolio-audit.md (FR-003,SC-002; roadmap; verify seven groups/no duplicated blockers; depends:T003).

## Phase 5: Verify and review

- [x] T005 P1 Validate links/diff, record verification.md and create audit commit/PR (FR-004,SC-001/002; reviewable audit; verify actual Git/PR result; depends:T004).

## Dependencies and implementation strategy

T001→T002→T003→T004→T005. No parallel write tasks. Source inventory and hosted
query may run independently. US1 is the useful minimum; US2 enables safe code
delivery. Separate implementation features follow this audit.

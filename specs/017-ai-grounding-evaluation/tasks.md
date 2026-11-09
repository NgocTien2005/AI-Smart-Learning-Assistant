# Tasks: Grounded study evaluation

## Phase 1: Setup

- [x] T001 P1 Record reproduced token/Unicode/output cases in verification.md and backend/test/fixtures/study-evaluation.json (FR-001/002/003,SC-001; deliverable original cases; verify red before fix; depends:none).

## Phase 2: Foundation

- [x] T002 P1 Implement offline runner backend/scripts/evaluate-study.mjs and backend/test/studyEvaluation.test.js with safe summaries/nonzero failure (FR-003/004,SC-001; deliverable >=12 cases in npm test; verify no network/DB path; depends:T001).

## Phase 3: US1 — local relevance (P1)

- [x] T003 [US1] P1 Correct case/token matching in backend/src/utils/studyAssistant.js (FR-001; deliverable stable source-only matching; verify positive/negative/casing cases and existing regression; depends:T002).

## Phase 4: US2 — trustworthy output (P1)

- [x] T004 [US2] P1 Tighten NFC/whitespace uniqueness in backend/src/services/demoCloudAssistant.js and evaluate citation/insufficient/modified-source cases (FR-002/005,SC-001; deliverable rejected malformed success; verify existing provider/access/source tests and new cases; depends:T002).
- [x] T005 [US2] P1 Document docs/ai-evaluation.md and actual local/backend/quiz/isolated results in verification.md (FR-003/004/005,SC-002/003; deliverable honest capability/rubric evidence; verify zero provider calls and real HTTP/DB separately; depends:T003/T004).

## Phase 5: Review

- [ ] T006 P1 Commit scoped changes, push/PR and record exact hosted result in verification.md (SC-002/003; deliverable review; verify actual SHA/jobs; depends:T005).

## Dependencies and strategy

T001→T002→{T003,T004}→T005→T006. Local utility and cloud validator changes are
independent after fixtures; execute sequentially for a small diff. No new task
duplicates012T012 or008/010 historical gates.

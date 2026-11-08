# Tasks: Demo cloud assistant
**Input**: spec/plan/contracts/research/data-model/quickstart. Safety, tests and real acceptance required.
## Phase 1: Setup
- [x] T001 Record user consent, official research and checklist review in verification.md; preserve008/010 blockers (FR006/009).
- [x] T002 Generate contract/source/provider failing regression tests in backend/test/demoCloudAssistant.test.js (FR001–007).
## Phase 2: Foundation
- [x] T003 Implement exact original demo source proof in backend/src/services/demoCloudAssistant.js using011 registry and committed original content/documents, denying modifications without external calls (FR002).
- [x] T004 Implement pinned bounded Gemini Interactions transport/output citations/quota/errors with injected fetch in backend/src/services/demoCloudAssistant.js; no retry/fallback/logged secrets or writes (FR003–007).
## Phase 3: US1/US2 — authorized grounded operation (P1)
Independent test: original accessible demo source accepted; unauthorized/non-demo/modified/configuration/error cases send no request or fail safely.
- [x] T005 Implement injectable production router backend/src/routes/demoCloudAssistant.js and mount in backend/src/app.js, boundary validation then auth/resource proof then provider; GET capability never calls provider (FR001–007).
- [x] T006 Configure server-only optional private key/free-only confirmation in compose.dev.yaml and .env.docker.example; document default disabled/no billing/provider limitations in docs/demo-cloud-ai.md and README; provide private scripts/start-demo-cloud-ai.ps1 launcher (FR006/007/009).
- [x] T007 Extend isolated seed verification in backend/scripts/demo-seed/verify.mjs for mounted disabled cloud capability/POST and resource denials, zero provider calls (FR001/002/009).
## Phase 4: US3 — explicit separate interface (P2)
Independent test: no automatic calls, finite choices, accessible states/citations and discarded late responses; local quiz/session behavior unchanged.
- [x] T008 Add frontend/src/components/DemoCloudAssistantPanel.jsx and focused component regressions in frontend/src/__tests__/DemoCloudAssistantPanel.test.jsx (FR003–005/008).
- [x] T009 Mount panel keyed by lesson/session in frontend/src/pages/CourseWorkspacePage.jsx, reusing existing styles without auth redesign (FR005/008).
## Phase 5: Verification and handoff
- [x] T010 Run full frontend test/lint/build, backend full/quiz tests and current isolated HTTP/DB/seed checks; record command/cwd/exit plus source hashes in verification.md (SC002–004).
- [x] T011 Check cloud panel on real Chrome1280x800/1440x900, disabled/source-denial and navigation/session guards; record evidence (FR008,SC004).
- [ ] T012 With private free-project API key and operator confirmation, evaluate all four real Gemini actions with valid source citations; do not store raw requests/key/reasoning. Keep open if configuration missing (FR004/006/009,SC001).
- [ ] T013 Complete traceability/read-only analyze/append-only converge and scoped commits/normal push; distinguish local/hosted/real provider evidence (FR009,SC004).
## Dependencies and implementation strategy
T001→T002→T003/T004→T005→T006/T007. T008 follows contract and may proceed independently of backend implementation; T009 followsT008. T010 precedesT011. T012 depends on private operator configuration and is not a CI requirement; continue independent checks if unavailable. T013 reports open gates without duplicating blockers. MVP first: privacy proof and bounded service, then mounted route and explicit UI, then actual acceptance. Independent unit/component tests may run concurrently; no parallel file editing required.


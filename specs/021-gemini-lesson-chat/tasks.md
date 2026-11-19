# Tasks: Gemini lesson chat

Input: [spec](spec.md), [plan](plan.md), contracts/data-model/research. All tasks require evidence in verification.md; a controlled test is not real-model acceptance.

## Phase 1: Setup

- [x] T001 P0 Capture clean baseline, official resolver/allocation, clarification and reviewed design in `specs/021-gemini-lesson-chat/`; accept when artifacts trace FR001–008 and read-only analyze has no blocking findings.

## Phase 2: Foundation and US2 access boundary

- [x] T002 [US2] P0 Write negative production-router/source tests in `backend/test/lessonChat.test.js`, then implement strict validation/source selection/pre-post authorization in `backend/src/{services,routes}/lessonChat.js`; depends T001; accept FR002–003/005, SC002–003, zero initial denied egress and source/session changes rejected.

## Phase 3: US1 conversation

- [x] T003 [US1] P1 Extend `backend/src/services/demoCloudAssistant.js` with bounded untrusted free text/history, shared budget and existing validated real transport; mount in `backend/src/app.js`; depends T002; accept FR004/006/008, finite demo regression and fake-transport contract tests pass without network calls.
- [x] T004 [US1] P1 Write `frontend/src/__tests__/GeminiChatPanel.test.jsx` before implementing `frontend/src/components/GeminiChatPanel.{jsx,css}` and workspace entry; depends T003; accept FR001/007, consent, conversation, duplicate/stale/cancel/error/clear regression and existing component suite pass.

## Phase 4: US3 configuration and recovery

- [x] T005 [US3] P1 Add private `scripts/start-gemini-chat.ps1`, explicit chat Compose flag and `docs/gemini-chat.md`/README instructions; depends T003; accept FR006/008 with boolean-only readiness, no secret file/output/provider call; verify launcher bridge tests and docs links.

## Phase 5: Verification and handoff

- [x] T006 P0 Run package gates, quiz, isolated HTTP/database integration and real desktop browser acceptance; record safe command/cwd/exit/results and traceability in `specs/021-gemini-lesson-chat/verification.md`; depends T002–005; accept SC002–004 and regression gates.
- [x] T007 [US1] P1 Verify two real Gemini questions with citations in actual UI using selected synthetic source and free project; depends T006 + privately configured readiness; record only safe outcome, no key/prompt/token/provider request. SC001. Blocked if key/Free readiness absent; user must configure privately, no fabricated response.
- [ ] T008 P1 Update `specs/021-gemini-lesson-chat/verification.md`, read-only analyze and append-only converge; make small feature commits/push and reviewable PR; depends T006 (T007 may remain explicitly blocked); FR008. Hosted CI reported on exact SHA separately, never merge/deploy automatically.

## Dependencies and execution

T001 → T002 → T003 → T004/T005 → T006 → T007/T008. T004 and T005 can be worked independently once contract is fixed (different files); no parallel agents needed. US2 is the security foundation rather than a deployable unsecured intermediate US1. Test-first per phase, incremental commits for specification, backend, UI/configuration and verification. No schema/dependency changes. MVP is scoped grounded lesson conversation; general web chat/persistence remains out of scope.

## Phase 6: Convergence

- [x] T009 [US1] P0 Repair actual chat generation per FR004/006, SC001 and plan2026-11-16 (partial): pin available Free3.1Flash-Lite/generateContent for chat only in `backend/src/services/demoCloudAssistant.js` and `routes/lessonChat.js`, preserve authorization/limits and old finite contract; extend `backend/test/lessonChat.test.js` transport/citation/blocked/truncated/error tests, run backend/quiz/integration and real UI two-turn source acceptance. Existing T007 remains its acceptance gate, not a duplicate transport task.

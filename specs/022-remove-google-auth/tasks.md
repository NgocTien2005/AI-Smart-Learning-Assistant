# Tasks: Retire Google authentication

## Phase1 Setup

- [x] T001 P1 Complete spec/clarify/plan/checklist and read-only analyze in specs/022-remove-google-auth; deliver mapped requirements and explicit breaking compatibility. Verify FR001-006 coverage before code.

## Phase2 US1 - Password UI

- [x] T002 [US1] P1 Add absence/password-flow regression in frontend/src/__tests__/passwordOnlyAuth.test.jsx, remove Google controls/handlers from pages/AuthPage.jsx and pages/AccountPage.jsx and orphan SDK/components/tests. Depends T001; FR001/003; deliver password-only auth/account, verify frontend test/lint/build and real three-role desktop flows.

## Phase3 US2 - Retired backend and configuration

- [x] T003 [US2] P1 Add production404 regression in backend/test/retiredAuth.test.js and backend/scripts/integration-check.mjs; remove src/routes/googleAuth.js, services/googleIdentity.js, app mount and env config. Depends T001; FR002-005; preserve data/schema/mapper, verify backend/quiz and isolated HTTP/database; zero provider calls/writes.
- [x] T004 [US2] P1 Remove OAuth build/compose settings and update README.md, frontend/README.md, AGENTS.md and docs/google-sign-in.md/current portfolio guides. Depends T002/T003; FR001/005/006; deliver accurate setup and retirement note, verify reference scan, Docker image/health and no missing links.

## Phase4 Verification and handoff

- [x] T005 P1 Record commands/exits and acceptance in specs/022-remove-google-auth/verification.md; run full frontend, backend/quiz, CI helpers, isolated integration, desktop1280x800/1440x900; reanalyze read-only, converge append-only, coherent commits with exact hosted/push limitation. Depends T002-004; SC001-003; no secret/profile/volume cleanup.

## Dependencies and parallel work

T001 -> T002/T003 -> T004 -> T005. UI and backend edits could be independent by file after contract approval; executed sequentially without agents. Deliver the coherent retirement only after password auth passes. Keep Gemini repair verification in021, never convert historical010 acceptance to a new feature task.

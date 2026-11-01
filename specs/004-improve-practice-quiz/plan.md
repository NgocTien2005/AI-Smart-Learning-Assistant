# Implementation Plan: Lumina practice quiz

**Branch**: Git branch unchanged; feature004-improve-practice-quiz | **Date**:2026-11-01 | **Spec**: [spec.md](spec.md)

## Summary

History left, one draft/result right, collapsed creation above detail. Keep API/generator/server authorization. Fix frontend lifecycle risks demonstrated in source and regression tests.

## Technical Context

**Language/Version**: JavaScript ES modules/React19; versions from existing package/lock.
**Primary Dependencies**: Existing React/React Router and UI; no additions.
**Storage**: React state/refs and existing server draft/version, no new persistence.
**Testing**: Existing npm test (Node services+Vitest/jsdom/RTL), lint/build; separate browser/HTTP evidence.
**Target Platform**:1280x800/1440x900 desktop, zoom100%.
**Project Type**: React/Vite to Express production/Prisma/PostgreSQL.
**Performance Goals**: Local filter,550ms debounce, serialized PUT per attempt with latest version, immediate duplicate locks.
**Constraints**: Frontend-only; parent/session/guards/backend/schema/dependencies/001-003 unchanged.
**Scale/Scope**: One caller/lesson history already provided by API; no pagination/analytics.

## Constitution Check

Pre-research and post-design PASS for design/scope, not runtime acceptance.

| Principle | Compliance |
| --- | --- |
| I Contract | App/Session(/api/auth/me)/CourseWorkspacePage/PracticeQuizPanel/apiRequest/production app/courses/quizAttempts/authenticate/access predicate/QuizAttempt; [contract](contracts/quiz.md). |
| II Authorization | No server change or ADMIN bypass; owner attempt + current course relationship on each operation. requireStudent default is not a production role guard. |
| III UX | History/detail/disclosure, five save states,0/null/legacy, keyboard/native radio/dialog, latest choices retained. |
| IV Evidence | Red regressions before code, required frontend checks, distinguish fixture/live/source; missing runtime keeps tasks open. |
| V Data/scope |172 baseline hashes; no secret/seed/reset/delete/commit; only5frontend files and004 artifacts. |

No exception/unresolved design choice. Browser/resources are external acceptance prerequisites.

## Project Structure

Feature artifacts: spec/plan/research/data-model/contracts/quickstart/checklists/tasks/verification.

Files to change/create:
- frontend/src/components/PracticeQuizPanel.jsx: lifecycle/composition.
- frontend/src/components/QuizHistory.jsx: filtering/list/status/selection.
- frontend/src/components/QuizCreateDisclosure.jsx: count/disclosure/focus.
- frontend/src/components/PracticeQuizPanel.css: scoped desktop styles.
- frontend/src/__tests__/frontend.test.js: behavior regressions; only setup changes for3existing quiz tests to open disclosure, preserving business assertions.

Read-only: parent CourseWorkspacePage, App/session/API/shared UI, backend/routes/middleware/schema/migrations and old CSS.

## Design Decisions

### D01 - Desktop hierarchy
Root .practice-panel.quiz-workspace; compact toolbar;260px+minmax(0,1fr) grid/gap20. Scrollable history, min-width0 detail; collapsed creation does not displace list. Full-width questions,20px headings/14-16px body, Lumina tokens/Inter/Lexend, course border/radius. Long strings wrap. Native radio/fieldset/legend, unique result anchors per attempt/question. No media/mobile/global changes.

### D02 - History and selection
Preserve server newest-first order. Local all/draft/submitted filter/count. No auto-open/create. Retain selected detail outside filter with clear action. Same active attempt is no-op. Opening another keeps old detail until success, has target-specific error/retry. Result back-history clears selection and focuses history, no write.

### D03 - Save serialization
Per-attempt session identity with answers/saved/version/pending/tail/blocked. Compare queued snapshot with saved only AFTER prior request drains; use version at PUT time. Guard mounted/session identity after responses; pending counter independent of answer revision. Success never overwrites current answers, and marks unsaved if latest differs.550ms debounce only for unsaved; failed/conflicted stop timers. Flush drains tail, captures latest answers and repeats until confirmed==latest or failure; returning to baseline still waits for an older pending write.

After a failed write acknowledgement, mark the baseline uncertain: an explicit retry must still perform a conditional PUT even if local choices equal the old confirmed snapshot. Only a successful write or fresh authoritative read clears uncertainty. A stale version then becomes explicit conflict rather than false saved confirmation (FR006/008, EC03/04).

### D04 - Recovery and transitions
Editing does not clear blocked conflict/failure or restart autosave. Explicit retry has ref lock. Conflict retry GETs latest version before PUT local; submitted in another tab offers loading result without overwriting. Recovery GET errors visible. Load saved confirms discard when local dirty/conflicted; cancel/Escape preserves answers.
Open/create/close/registered parent leave all flush. Immediate locks for create/submit/recovery/close; separate latest-intent sequence for history opening. Choices disabled for mutations/transition, editable during background autosave. Only successful flush or explicit discard permits transition. Fix broken Vietnamese literal. Unload warns for dirty/pending/blocked, does not promise saving.

### D05 - Reads and stale responses
History sequence+AbortController+mutation generation invalidated before/after create/submit. Opening has sequence/target, latest result only; failure retains detail. Invalidate intents on mutations/close; lesson-key wrapper prevents standalone rerender stale responses. Submit waits latest confirmed answers, POSTs that version, prevents duplicates; success refreshes history. Read failure never replays create/submit.

### D06 - Counts and results
Creation count integer3..10 retains across collapse/errors. POST requested/actual used when provided; reopen count=questions.length with no invented requested count.422 shows useful source error and local-pattern capability. Result0 valid; legacy selectedIndex/isCorrect null is unavailable data. Keys/source rendered only in submitted result; sourceRevision never rewrites snapshot.

### D07 - URL and leave contract
Keep parent course/lesson key, flush registration and guarded in-app controls. Existing section/lesson/panel URL only, no attemptId query. Browser refresh/back/forward restores lesson context and user chooses confirmed draft from history. Do not promise blocking all browser history or local-draft persistence over remount. No lesson layout rewrite.

### D08 - Evidence
[Quickstart](quickstart.md) V01-09; final FR/US/AC/SC/task/evidence trace. Desktop requires current implementation served in allowed test runtime, working browser and valid sessions; old container/screenshots not evidence. Independent unauth HTTP allowed; authenticated writes need designated existing safe resources. Integration provisioning/cleanup not authorized. Preserve old open tasks separately.

## Complexity Tracking

No constitutional exception or new architecture/dependency.

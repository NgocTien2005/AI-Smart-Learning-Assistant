# Feature Specification: Lumina practice quiz experience

**Feature Branch**: Unchanged Git branch; official feature directory004-improve-practice-quiz.
**Created**: 2026-11-01
**Status**: Draft; implementation acceptance pending.
**Input**: Improve finding/resuming attempts, question focus, compact creation and truthful save/recovery feedback. Preserve existing business rules and permissions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and resume attempts (Priority: P1)

Learners find their own history and open an unfinished attempt or submitted result.
**Why this priority**: History must be reachable without scrolling past all questions.
**Independent Test**: Open unfinished, submitted-zero-score and legacy attempts from history.

**Acceptance Scenarios**:

1. **US1-AC1 Given** history exists, **When** opening practice, **Then** history and detail appear side by side, with unfinished/submitted status, date, actual question count and available score.
2. **US1-AC2 Given** several attempts, **When** filtering all/unfinished/submitted, **Then** counts match; a selected attempt outside the filter retains its detail with a notice and clear-filter action.
3. **US1-AC3 Given** an unfinished attempt, **When** opening succeeds, **Then** its saved questions/answers and selection appear; entering practice does not automatically create or open an attempt.
4. **US1-AC4 Given** history/detail reads fail, **When** retrying, **Then** only the failed read repeats; current answers/detail remain, and older responses cannot change a newer selection.

### User Story 2 - Answer, save and recover (Priority: P1)

Learners focus on questions and understand whether their current choices are saved.
**Why this priority**: Slow/failed requests must not lose or misdirect answers.
**Independent Test**: Change answers during a delayed save, fail saving, recover and switch attempts.

**Acceptance Scenarios**:

1. **US2-AC1 Given** an unfinished attempt, **When** answering, **Then** answered count and unsaved/saving/saved labels reflect real confirmation; correct answers remain hidden.
2. **US2-AC2 Given** a pending save, **When** changing answers including returning to a previously saved choice, **Then** saves remain versioned and sequential; an older acknowledgement does not falsely confirm current choices.
3. **US2-AC3 Given** failed/conflicted saving, **When** recovering, **Then** current choices remain; network errors allow explicit retry, conflicts allow saving current choices after checking latest state or loading saved state with an explicit discard warning.
4. **US2-AC4 Given** unconfirmed changes, **When** switching attempts, creating another, closing or using existing guarded in-app leave controls, **Then** latest choices are flushed; failure offers stay or explicit discard. Reload/tab close only warns and does not promise network persistence.
5. **US2-AC5 Given** all questions answered, **When** submitting, **Then** latest answers are saved first, duplicate submission is prevented and choices are disabled while submitting; errors retain choices and success displays the correct attempt result.

### User Story 3 - Compact creation and clear results (Priority: P2)

Learners open creation only when needed and understand local generator limitations.
**Why this priority**: Forms should not displace history or active questions.
**Independent Test**: Open/collapse creation, request more questions than available or receive an unsuitable-source error, then review results.

**Acceptance Scenarios**:

1. **US3-AC1 Given** initial entry or an active attempt, **When** creation is not requested, **Then** its form is collapsed; opening/collapsing keeps the count without writing and manages focus.
2. **US3-AC2 Given** a request for3-10 questions, **When** creating, **Then** pending/error feedback is clear and errors retain the form/count; success collapses creation, selects the new attempt and reports fewer actual questions. Reopened attempts do not invent an unavailable requested count.
3. **US3-AC3 Given** a submitted attempt, **When** viewing results, **Then** score0 is valid; total, selected/correct answers, explanation and source appear only when provided; legacy missing choices are distinguished from incorrect answers.
4. **US3-AC4 Given** results, **When** returning to history or changing attempts, **Then** submission does not repeat; history remains reachable and old responses cannot replace the result.

### User Story 4 - Desktop and system boundaries (Priority: P1)

People can use the keyboard and navigate without mixing attempts or regressing learning flows.
**Why this priority**: Quality needs evidence and must preserve existing data.
**Independent Test**: Two desktop sizes, both permitted roles, long content and navigation/access regressions.

**Acceptance Scenarios**:

1. **US4-AC1 Given**1280x800/1440x900 desktop at100% zoom, **When** scrolled to panel start, **Then** history, creation action and start of detail are discoverable without scrolling past forms/questions; no horizontal overflow.
2. **US4-AC2 Given** Tab/ShiftTab/Enter/Space/Escape and long content, **When** selecting, answering, collapsing or cancelling dialogs, **Then** controls have names, focus is visible/restored and all content is readable.
3. **US4-AC3 Given** lesson/course changes or overlapping history/open/save/create/submit requests, **When** old responses arrive, **Then** they cannot change newer data/selection/notices. Existing section/lesson/panel addresses remain; refresh/back/forward restores lesson context and saved attempts are resumed from history.
4. **US4-AC4 Given** missing access, **When** using another person's attempt or leaving the course, **Then** server denial remains; session/dashboard/lesson/document/assignments/grading/account/ADMIN do not regress.

### Edge Cases

- EC01: Empty vs read error vs no-match; missing score vs0.
- EC02: Fewer generated questions or unsuitable source;3-10 is requested count.
- EC03: Pending save followed by changes returning to baseline; older acknowledgement/version.
- EC04: Network/409/other-tab submission; no automatic overwrite of conflicts.
- EC05: Fast attempt/lesson/course switches, duplicate create/submit/retry/leave, unmount.
- EC06: Long prompt/option/source, native radio/dialog keyboard, legacy unavailable choices.
- EC07: Missing browser/session/designated test resources; no provisioning/seed/reset/deletion to pass acceptance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: MUST preserve access: enrolled learners or course-owning instructors use only their own history/attempts; no new ADMIN content privilege.
- **FR-002**: MUST prioritize history and one detail area before forms or long question lists.
- **FR-003**: MUST filter all/unfinished/submitted with real counts, selected semantics and retained detail outside filters plus clear action.
- **FR-004**: MUST keep newest-first history with sourced dates/counts/scores; missing data must not become0.
- **FR-005**: MUST open the selected saved draft/result; no automatic creation or opening on entry.
- **FR-006**: MUST prioritize questions/choices, answered count and five save states; saved means current choices were confirmed.
- **FR-007**: MUST retain debounced versioned sequential drafts, source snapshots and existing grading; answer keys only in submitted results.
- **FR-008**: MUST retain choices on errors; retries must not recreate/resubmit. Failed/conflicted states wait for explicit recovery, even after editing choices.
- **FR-009**: MUST flush latest choices before switch/create/close/existing guarded in-app leave; failures offer stay/confirmed discard. Unload only warns.
- **FR-010**: MUST submit only complete/latest-saved answers, prevent duplicates, disable choices while pending, retain choices on failure and finalize on success.
- **FR-011**: MUST default creation closed; opening/collapsing does not write and retains count/error; only confirmed success collapses it automatically.
- **FR-012**: MUST request3-10 questions, show sourced actual count and useful unsuitable-source errors; describe limited local patterns, not general AI/OCR.
- **FR-013**: MUST display sourced score/total/selected/correct/explanation/source; distinguish0 and legacy unavailable answers.
- **FR-014**: MUST provide contextual loading/empty/no-match/error/retry/pending/success for history/detail/create/save/submit; read retry preserves active draft.
- **FR-015**: MUST ignore stale responses for old resources/selections/notices, including history overlapping mutations, fast switches and unmount.
- **FR-016**: MUST preserve section/lesson/panel addresses; no attempt address or auto-resume promise. Reload/back/forward restores lesson context and confirmed attempts can be selected from history.
- **FR-017**: MUST support labelled controls, keyboard/focus/native radios/dialogs and readable long content at both desktop sizes; collapsed controls are outside Tab order.
- **FR-018**: MUST preserve session/dashboard/lesson/document/assignments/grading/account/ADMIN and existing contracts/backend/data/dependencies.
- **FR-019**: MUST distinguish automatic/runtime evidence; write only to identified safe existing test resources; otherwise keep tasks open, without provisioning/seed/reset/delete or secret reads/output.
- **FR-020**: MUST limit changes to related frontend and new feature artifacts, preserving001-003/open tasks/constitution/managed tooling; no mobile, external AI, analytics/notification/OAuth, commit/push/PR/merge/deploy.

### Key Entities

- Attempt: owned by a user and lesson, immutable question snapshot, versioned draft and submitted result.
- Current choices: may be newer than the last confirmed snapshot.
- History: caller's attempts in a lesson; not system-wide analytics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At both desktops, history/action/detail start are discoverable from panel start without scrolling past creation/questions; long content creates no horizontal overflow.
- **SC-002**: Every history/filter/selection case shows the correct attempt/status/date/count/score, including0 and no-match.
- **SC-003**: Every delayed/failed/conflicted save case retains latest choices, with no false saved label or cross-attempt write.
- **SC-004**: Every create/submit/switch/leave case avoids duplicate writes and losing choices outside confirmed discard; actual counts/results match stored data.
- **SC-005**: Selection/answering/disclosure/recovery/dialog cancellation work with keyboard at both desktops; long content remains readable.
- **SC-006**: Navigation/session/access regressions have suitable evidence and mandatory automatic checks pass; missing runtime checks retain reasons/open tasks and prevent declaring feature complete.
- **SC-007**: All changed files are in scope;001-003/open tasks and restricted layers remain unchanged.

## Assumptions

- Existing ownership/enrollment governs roles; no new privileges, global search or pagination.
- History uses server newest-first order; filtering/selected attempt are local. Only section/lesson/panel is address-backed. No automatic opening of the newest attempt.
- History refresh preserves current draft. Remount/reload only restores server-confirmed answers after choosing history.
- Old snapshots survive source revisions. Reopen question count comes from snapshot; requested count is not persisted by the existing contract.
- Browser access host is unavailable; inventory shows Chrome New Tab, not a live quiz observation. Resource answer "ok" identifies no course/lesson/attempt; live writes remain blocked.

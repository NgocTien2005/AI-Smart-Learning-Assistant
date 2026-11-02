# Feature Specification: Local Document Study Workspace

**Feature Branch**: `005-improve-document-study` (artifact identifier; Git branch is independent)
**Created**: 2026-11-01
**Status**: Accepted — 2026-11-02, isolated acceptance stack; see verification.md.
**Input**: Improve local lookup history, compact question entry/recovery and extractive lesson summaries within Lumina's existing course workspace.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and revisit lookup answers (Priority: P1)

An enrolled STUDENT or owning INSTRUCTOR reads private lesson lookup history, distinguishes questions from answers and reaches new replies without losing their place.

**Why this priority**: Reading the answer and retaining context are the primary learning activities.
**Independent Test**: Open empty/populated/long history; reload while reading older content and after a confirmed send.

**Acceptance Scenarios**:

1. **US1-AC1**: Given available history, when lookup opens, then lesson identity, local-lookup explanation, questions, answers and a compact separate composer have distinct hierarchy, with history prioritized.
2. **US1-AC2**: Given initial loading, empty history or a failed read, when the read settles, then these states are distinct; a failed reload preserves confirmed replies and the draft.
3. **US1-AC3**: Given a history read overlaps a successful send, when either response arrives last, then the confirmed reply appears once, is not removed by that read, and history reload does not cancel send completion.
4. **US1-AC4**: Given the reader is more than 56 pixels from the history bottom, when a reply arrives, then reading position stays in place and a keyboard-accessible new-reply action reaches the latest reply; near-bottom readers follow new replies.
5. **US1-AC5**: Given historical messages and changed lesson content, when history loads, then messages remain under the existing history contract with a note that answers may use earlier content; no invented revision or citation is assigned.

### User Story 2 - Ask and recover without losing work (Priority: P1)

The learner enters a question, understands pending/failure states and keeps a newer draft while an earlier question completes.

**Why this priority**: Lost input and ambiguous retries interrupt learning and can duplicate history.
**Independent Test**: Validate boundary questions, type during a delayed send, reload concurrently, and recover from unavailable source/network failure.

**Acceptance Scenarios**:

1. **US2-AC1**: Given a trimmed question outside 3–1000 characters, when sending is attempted, then no request is sent and the constraint is understandable; valid entry/send is keyboard accessible.
2. **US2-AC2**: Given a pending send, when send is activated again, then only one request is issued, pending is announced and the composer remains editable.
3. **US2-AC3**: Given a send succeeds, then its confirmed reply and concise success appear; the input clears only if unedited since send began, including editing away and back to identical text.
4. **US2-AC4**: Given a send fails, then current input remains, the composer has an associated error and read-only history recovery is offered before explicitly sending again. There is no automatic POST replay or guarantee of server deduplication.
5. **US2-AC5**: Given no usable text, then source unavailability is distinct from a successful textual no-match answer; PDF text-layer limitations are explained without assuming every unavailable source is a scanned PDF.
6. **US2-AC6**: Given an open panel, then edits/retry/history reload retain the draft; close, lesson/course/source revision change or refresh ends its in-memory lifetime. A send already received by the server may appear in later history after closing.

### User Story 3 - Understand summaries and their source (Priority: P2)

The learner reads extractive source sentences with clear provenance and available page references, and recovers from unavailable or failed summaries.

**Why this priority**: Source limits prevent mistaking extraction for generated explanation or OCR.
**Independent Test**: Open document/manual/truncated summaries, partial/absent page references, short text, unavailable text and failed/retried requests.

**Acceptance Scenarios**:

1. **US3-AC1**: Given summary points, then label them extractive, show returned source type and truncation, and show page labels only where supplied; do not invent links or chat citations.
2. **US3-AC2**: Given usable short text returning no points, then show a successful empty-result explanation with supplied metadata, distinct from unavailable source, loading and failure.
3. **US3-AC3**: Given unavailability/failure, when retrying, then show pending, prevent duplicate retries and accept only the current request's result.
4. **US3-AC4**: Given a lesson/revision change, then old points are absent immediately and late responses cannot appear under the new title. A returned revision inconsistent with a known selected revision shows changed-source recovery without displaying those points.

### User Story 4 - Use panels safely in the workspace (Priority: P2)

Users retain familiar navigation, readable desktop content and current server boundaries.

**Why this priority**: Panel improvements must preserve existing learning flows and permissions.
**Independent Test**: Exercise direct URLs, refresh/back/forward, rapid context changes, keyboard/long content, quiz leave protection and resource denial.

**Acceptance Scenarios**:

1. **US4-AC1**: Given context changes/closure during history/send/retry, then delayed results/errors never enter the new context or clear its draft.
2. **US4-AC2**: At 1280×800 and 1440×900, 100% zoom, long titles/questions/answers/points wrap without horizontal page overflow; controls and separate history/composer remain reachable without overlays hiding reading content.
3. **US4-AC3**: Keyboard-only entry/send/history/retry/latest/close has labels, visible focus, logical order and concise announcements. Existing native dialogs and quiz stay/discard behavior remain effective.
4. **US4-AC4**: Direct links, refresh/back/forward preserve section/lesson/panel and quiz leave protection; dashboard, protected documents, assignments/grading, account/auth and ADMIN boundaries retain their behavior.

### Edge Cases

- **EC-01**: History before/after send, out-of-order or empty snapshots, reload failure with confirmed replies.
- **EC-02**: Double activation before pending renders; whitespace/boundary lengths; edit away and back.
- **EC-03**: Uncertain failed POST may be saved; an absent history reply does not prove it was never saved.
- **EC-04**: Lesson/course/source revision/close during any request; known summary revision mismatch.
- **EC-05**: More stored messages than the current window; historical source unknown; textual no-match success.
- **EC-06**: Short/no text, extraction failure, document/manual source, truncation and partial page metadata.
- **EC-07**: Unbroken long content, keyboard scroll, short history becoming scrollable, guarded quiz exit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preserve authenticated owner/enrollment checks, private per-user history and ADMIN course restrictions. (US4-AC4)
- **FR-002**: Prioritize readable question/answer history and lesson identity above a compact separate composer consistent with the workspace. (US1-AC1; US4-AC2)
- **FR-003**: Distinguish initial history loading, empty history, reload pending and error/retry; retain confirmed content and draft on reload. (US1-AC2)
- **FR-004**: Concurrent reads/sends preserve confirmed replies once without one operation disabling the other's completion. (US1-AC3)
- **FR-005**: Preserve the returned history window and historical content, explain possible earlier sources, and add no pagination or unsupported citations/provenance. (US1-AC5)
- **FR-006**: Preserve older reading position beyond the 56-pixel bottom threshold and offer accessible latest-reply access; near-bottom readers follow replies. (US1-AC4)
- **FR-007**: Validate 3–1000 trimmed characters before sending with a label and clear constraints. (US2-AC1)
- **FR-008**: Allow only one pending send per panel, preventing repeated requests while keeping the draft editable. (US2-AC2)
- **FR-009**: Show confirmed reply/success and clear only an unedited submitted draft. (US2-AC3)
- **FR-010**: Retain current input on failure and offer explicit recovery without automatic POST replay or unsupported idempotency guarantees. (US2-AC4)
- **FR-011**: Distinguish source unavailability from successful textual no-match; accurately describe local lookup and text-layer PDF limits. (US2-AC5)
- **FR-012**: Preserve draft through same-panel activity; end it on close, refresh or context change; promise no unload network persistence. (US2-AC6)
- **FR-013**: Label summaries extractive and display only supplied source type/truncation/optional point pages. (US3-AC1)
- **FR-014**: Distinguish summary loading, points, successful empty points, unavailable source, error/retry and retry pending. (US3-AC2/3)
- **FR-015**: Scope responses to context and operation; suppress stale replies/errors and known mismatched summary revisions. (US3-AC4; US4-AC1)
- **FR-016**: Support keyboard, visible focus, concise accessible messages, disabled states and long content at both desktop sizes. (US4-AC2/3)
- **FR-017**: Preserve URL/panel lifecycle, session recovery, protected documents, quiz autosave/version/leave and other workspace/account flows. (US4-AC4)
- **FR-018**: Link acceptance to evidence, distinguishing source/fixture/live and leaving unavailable runtime checks open without modifying earlier feature acceptance. (SC-007)

### Key Entities *(include if feature involves data)*

- **Lesson context**: Course/lesson identity, source revision and panel lifetime.
- **Lookup message**: Confirmed question/answer, identity and creation time; historical source provenance is not supplied.
- **Question draft**: In-memory text/edit lifetime, distinct from a pending question and confirmed reply.
- **Extractive summary**: Source sentences/type/revision/truncation and optional point pages.
- **Operation state**: Initial read, reload, send or retry pending/success/unavailable/failure within its context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All long-content cases at both desktop sizes/100% zoom wrap without horizontal page overflow; history and compact composer are separately reachable without covering content.
- **SC-002**: Every history/send race retains confirmed replies once and newer drafts, with zero previous-context content/errors after switching.
- **SC-003**: All boundary/duplicate cases issue the expected zero or one send; every failed send retains its current draft and offers recovery.
- **SC-004**: Every summary case distinguishes loading/points/empty/unavailable/failure; only supplied metadata/pages appear and no known stale-revision points display.
- **SC-005**: Keyboard-only users can enter/send/reload/retry/scroll/latest/close with visible focus; announcements do not re-read the whole history.
- **SC-006**: Direct links/refresh/back/forward retain current lesson/panel, quiz protection and access boundaries in verified role/resource cases.
- **SC-007**: Every acceptance scenario maps to tasks and passed/failed/not-run evidence with reasons; missing required desktop/server evidence remains open.

## Assumptions

- Existing enrolled STUDENT and owning INSTRUCTOR workspace access; no new role grants.
- Drafts remain local to the mounted lesson/source panel; no durable/cross-panel storage.
- History reads retain the current latest-50-message window. Confirmed sends in the current panel survive an overlapping snapshot that omits them, within the same latest-50 visible window; no older-history fetching or pagination is added.
- Local no-match remains a successful textual answer rendered verbatim, without a new structured result type.
- Page labels are informational, with no new document-navigation contract.
- Existing frontend/dependencies only; no API/backend/data/schema/migration, generator/processing, session or permission changes. No mobile feature, external AI, OCR, notification, analytics or OAuth.
- Current served code/browser and identified safe existing resources are needed for live acceptance; no provisioning/seeding/destructive cleanup or unapproved writes to manufacture evidence.

# Feature Specification: Gemini lesson chat

**Feature Branch**: `feat/gemini-lesson-chat`
**Created**: 2026-11-12
**Status**: Clarified
**Input**: Real Gemini chat box for free-form questions about deliberately selected, authorized lesson/document content; Gemini Free only, billing disabled.

## Context

The existing cloud demo sends four fixed actions and canned questions over original synthetic sources. It is a real provider adapter when configured, but does not offer free-form conversation. Replace its primary workspace entry with a lesson-focused chat while preserving the finite demo API and local tools. A provider key alone must not expand data sharing silently.

## Clarifications

### Session 2026-11-12

- Q: What may leave Lumina for Google? → A: Free-form questions and lesson/document content explicitly selected by users who may view it; Gemini Free only, billing disabled.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ask about a selected lesson (Priority: P1)

An enrolled student or owning instructor opens Chat Gemini, chooses the displayed lesson source, acknowledges sharing with Google and types a question. They see their messages and grounded Vietnamese responses with inspectable quotations.

**Why this priority**: Provides the requested real conversation rather than a canned-action demo.
**Independent Test**: Ask two related questions about an authorized synthetic lesson using a configured real provider; inspect each answer against its source.

**Acceptance Scenarios**:

1. **Given** a readable lesson and ready provider, **When** the user selects its source, acknowledges disclosure and submits a question, **Then** a real model answer or honest provider error appears; no local/mock answer substitutes for it.
2. **Given** one answer in the current view, **When** a follow-up is sent, **Then** bounded recent turns accompany the same selected source and visible history remains coherent.
3. **Given** missing context, **When** a question cannot be supported, **Then** the answer explicitly says the source lacks sufficient evidence.

### User Story 2 - Keep control of sharing and access (Priority: P1)

**Why this priority**: Permission to read course data is not automatic permission to export it.
**Independent Test**: Unauthorized access, missing consent, changed revision and late revoked access are rejected before content is shown; denied initial requests make zero provider calls.

**Acceptance Scenarios**:

1. **Given** no selection or acknowledgment, **When** submitting, **Then** sharing is refused.
2. **Given** another instructor, unenrolled student or administrator without course access, **When** requesting chat, **Then** no course text is disclosed or sent to Google.
3. **Given** a pending response, **When** source, course access or session changes, **Then** its result is discarded. Changing lesson/session resets conversation and consent.

### User Story 3 - Recover from configuration and quota errors (Priority: P2)

**Why this priority**: Free provider limits and runtime-only keys must remain understandable.
**Independent Test**: Missing key, quota, timeout, malformed citations and cancel produce distinct safe messages without automatic retries.

**Acceptance Scenarios**:

1. **Given** no runtime key/Free confirmation/chat enablement, **When** opening chat, **Then** setup guidance appears; no secret entry exists in the web UI.
2. **Given** provider failure, **When** sending, **Then** input is retained and retry is manual; no duplicate or paid fallback is sent.
3. **Given** chat history, **When** clearing/closing it, **Then** memory is discarded; reload does not restore private conversation.

### Edge Cases

- Empty/oversized questions, forged source IDs/history roles, missing acknowledgment, stale source revision and unknown request fields are rejected.
- Missing source yields an empty state. Oversized sources send only the disclosed bounded excerpt; the UI identifies truncation. No automatic file fetching or OCR.
- Source text, user text and history can contain hostile instructions; they are untrusted data, never executable tools or trusted system instructions.
- Exact quotation validation is necessary but does not prove semantic correctness; UI asks users to review citations.
- Cancel/timeout may occur after Google received a request; no automatic replay or guarantee of provider cancellation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide free-form Vietnamese study chat within the selected lesson, clearly named Chat Gemini; local lookup, extractive summaries and persisted quizzes retain their separate identities.
- **FR-002**: Export only a server-resolved selected lesson source, its title, the question and bounded conversation after explicit per-view selection and acknowledgment. State Google Free data-use implications before sending; never export account identity, tokens, other courses or raw uploads.
- **FR-003**: Check current authentication and instructor ownership/student enrollment before access and again after generation. Administrators have no content bypass. Require current source revision, compare source identity/text after generation and suppress stale UI/session responses.
- **FR-004**: Use actual Gemini responses with bounded recent conversation; validate structure and source quotations, require citations for supported answers and an explicit insufficient-evidence response otherwise. No rule-based/mock/paid fallback or automatic retry.
- **FR-005**: Bound questions to 2,000 characters, six history turns of at most 6,000 characters each, source to 12,000 characters, output to 6,000 characters and eight citations. Disclose excerpting and reject malformed fields before provider work.
- **FR-006**: Require server-only key, Free-only confirmation and explicit chat source-scope enablement. Fixed existing text model, no tools/search/remote URLs. Limit one active request, 20 requests/day/process, 20-second per-user cooldown and 30-second deadline; stop with safe errors on quota/configuration/provider/output failures. These are single-process guards, not a billing-enforcement API.
- **FR-007**: Accessible question input, visible history, source selection, acknowledgment, loading, missing-source/configuration, errors, cancel and clear controls; prevent duplicate submits. Reset memory and sharing consent on lesson/revision/session changes; never persist/log chat content or provider payloads.
- **FR-008**: Preserve the old finite demo API, auth/Google linking, local tools and quiz lifecycle. No new dependency, schema or migration is needed. Provide safe private setup and truthful model acceptance evidence.

### Key Entities

- Selected source: authorized lesson, source kind/revision, bounded text and quotation IDs.
- Conversation: current-view question/answer turns in browser memory; no durable account record.
- Provider readiness: boolean key/configuration flags, not proof of quota, free billing status or answer quality.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two consecutive real questions about a selected test lesson produce grounded replies with valid quotations, or are recorded as blocked rather than fabricated.
- **SC-002**: Every denied initial access, missing-consent, invalid-input and stale-selection case in the regression matrix produces zero provider requests.
- **SC-003**: Late revoked-session/access/source responses are never displayed in tested cases; no content is exported from a different lesson.
- **SC-004**: At both 1280×800 and 1440×900, keyboard users can select a source, acknowledge sharing, type, submit, cancel and clear without horizontal overflow.

## Assumptions

- Chat is confined to one lesson at a time; no general web assistant, cross-course search, agent tools, streaming or saved conversation in this iteration.
- Source selection means the existing shared source resolver: successfully extracted document first, otherwise manual lesson text. The displayed kind and truncation make this explicit.
- Recent visible history is untrusted context, not proof of previous model output. Closing/unmounting clears it; successful answers only are added.
- Free project billing must be independently disabled by the operator; Lumina cannot inspect billing from an API key. No paid escalation is allowed. Google Free services may use prompts/output for product improvement; users should not send confidential data.
- Historical feature012 real-provider acceptance remains independent; feature008 cleanup limits remain unchanged.

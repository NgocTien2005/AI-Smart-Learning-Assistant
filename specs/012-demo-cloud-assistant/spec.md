# Feature Specification: Grounded demo cloud assistant

**Feature Branch**: independent of main; officially allocated012-demo-cloud-assistant
**Created**: 2026-11-08
**Status**: Specified
**Input**: User approves Gemini free tier, zero budget, only original synthetic demo data and nonprivate demo questions; private API key outside chat.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn with grounded demo responses (Priority: P1)
A permitted instructor/student selects a demo lesson and explicitly requests a Vietnamese explanation, summary, source-based answer or practice questions with citations.
**Why this priority**: Provides real model assistance without misrepresenting local templates.
**Independent Test**: Real configured model returns useful Vietnamese text and verified source excerpts for all four actions.
**Acceptance Scenarios**:
1. Given an unchanged original demo lesson and permission, when requesting assistance, then the response identifies the real provider/model and cites lesson excerpts.
2. Given a practice request, when completed, then questions/options/answers/explanations reference the selected source and do not create or alter existing graded quiz attempts.
3. Given insufficient support, when answering, then the assistant explicitly reports insufficient evidence rather than inventing a supported claim.

### User Story 2 - Preserve access, privacy and zero-budget operation (Priority: P1)
Only authorized, unchanged synthetic demo sources can leave the server; private account data, session information, histories and real documents cannot.
**Why this priority**: User consent is restricted; resource authorization applies before any provider request.
**Independent Test**: Unauthorized/non-demo/modified sources and arbitrary outgoing input are denied with zero provider calls.
**Acceptance Scenarios**:
1. Given another owner's course or missing enrollment, when requesting, then deny before provider access.
2. Given real or modified lesson content, when requesting, then deny external processing even if the user normally can read it.
3. Given missing key/operator free-project confirmation, exhausted limits or provider failure, when requesting, then show an honest unavailable/error response without paid/model/local fallback or automatic retry.

### User Story 3 - Use a clear recoverable interface (Priority: P2)
A separate cloud section identifies its scope/cost limits and preserves the existing local assistant, quiz and session behavior.
**Why this priority**: Avoid accidental data sends and confusing local extraction with generation.
**Independent Test**: Explicit request only, accessible loading/error states, late response discarded after lesson/session change; nothing sent on render.
**Acceptance Scenarios**:
1. Given a selected source, when no explicit request has occurred, then zero cloud calls.
2. Given navigation while generation is pending, when a late response arrives, then it cannot populate another lesson.
3. Given a failure, when the page remains open, then retain inputs and allow an explicit new request with no automatic replay.

### Edge Cases
Missing registry/missing or modified file/source, inactive user, revoked enrollment, injection text in source, invalid provider JSON/citations, blocked/truncated response, rate limiting, timeout, unavailable model, operator accidentally enabling paid billing, browser navigation during a request.

## Requirements *(mandatory)*
### Functional Requirements
- **FR-001**: Existing server authentication and per-course owner/enrollment authorization MUST precede provider access; ADMIN gets no new content bypass.
- **FR-002**: Only unchanged, original synthetic sources owned by dataset lumina-demo-v2 MAY be sent. Server MUST prove source identity against original content; client-provided text/URLs/history MUST NOT be accepted for egress.
- **FR-003**: Requests MUST support source-based Q&A, explanation, summary and review questions in Vietnamese. Initial Q&A uses a finite set of nonprivate demo questions; arbitrary user text awaits separate expanded consent.
- **FR-004**: Responses MUST identify provider/model and present valid source excerpts; fabricated/out-of-source citations and invalid output MUST be rejected. Insufficient evidence MUST be explicit. Citation checks are not a guarantee of factual accuracy.
- **FR-005**: Cloud quiz MUST remain separate from existing versioned/resumable graded attempts; no overwrite of local assistant/summary/quiz behavior or histories.
- **FR-006**: Cloud MUST default disabled, keep key server-only, and require operator confirmation of a free-only project without billing. No paid tools, provider/model fallback or automatic retries. Provider project billing cannot be verified by this app; zero cost requires operator's free-project setup.
- **FR-007**: Provider operation MUST have bounded source/output/time/concurrency and daily requests; exceed limits returns a safe error. Do not log/upload keys, requests, model reasoning, source content or raw provider errors.
- **FR-008**: UI MUST require explicit action, disclose external processing of demo data and free-tier product-improvement terms, show distinct loading/error/empty/success, and prevent late cross-lesson/session results.
- **FR-009**: Real-model acceptance MUST be separate from mock/unit/disabled-state checks; no success claim without actual configured calls and evaluated output. No real model requests in PR CI.

### Key Entities
Original demo source proof, permitted finite demo request, grounded response with verified excerpts, ephemeral limits and server-only operator configuration. No new persistent user data.

## Success Criteria *(mandatory)*
### Measurable Outcomes
- **SC-001**: All four actions produce evaluated real-model responses from the selected original demo source when configured.
- **SC-002**: Every tested unauthorized/non-demo/modified source sends zero provider calls; citation validation rejects fabricated excerpts.
- **SC-003**: Missing config, timeout, invalid output and rate limits produce recoverable errors with no silent fallback or automatic retry.
- **SC-004**: Full applicable backend/frontend/integration checks and both desktop sizes are recorded, distinguishing real provider acceptance from controlled tests.

## Assumptions
The operator configures a free-only Google AI Studio project and key privately. No billing activation is authorized. Current availability/limits can change; an unavailable model stays an explicit error. Free-tier data may improve Google products, already disclosed and accepted for synthetic demo only. No model download or local runner installation. Existing 008T026 and010T016 blockers remain in their features.

## Clarifications
### Session 2026-11-08
- Cloud chosen; user accepted recommendation of Gemini free tier, zero budget and only synthetic demo/nonprivate demo questions.
- Initial fixed question choices prevent accidental private free-text egress; general free-form tutoring remains outside this consent scope.

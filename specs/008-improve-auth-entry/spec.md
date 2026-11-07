# Feature Specification: Lumina authentication entry and recovery

**Feature Branch**: Existing Git branch unchanged; official feature directory008-improve-auth-entry.
**Created**: 2026-11-02
**Status**: Implemented; runtime checks passed; real email/reset acceptance user-confirmed (T023 closed);25/26tasks, T026 profile cleanup policy-blocked
**Input**: Improve login, registration, forgot/reset password with existing contracts, identity verification and role boundaries.

## User Scenarios & Testing

### User Story 1 — Sign in and verify identity (Priority: P1)
People sign in with their existing account and reach an appropriate, verified destination.
**Why this priority**: Unverified or obsolete sign-in results must not grant access or replace a newer session.
**Independent Test**: Sign in for each role, verify identity, recover a failed verification without resending credentials.
**Acceptance Scenarios**:
1. **US1-AC1**: Given valid credentials for any of the three roles, sign-in reaches the permitted intended internal destination only after identity verification; external/auth/reset or role-forbidden destinations fall back safely.
2. **US1-AC2**: Invalid email/password input produces associated errors and no request; wrong credentials are an operation failure and never expire a newer valid session.
3. **US1-AC3**: Pending sign-in prevents duplicate/conflicting submissions; slow responses after departure, mode change, logout or session replacement cannot install credentials, display stale outcomes or navigate the new user.
4. **US1-AC4**: A confirmed credential response followed by failed identity verification shows a separate read-only recovery state; retry verifies identity only, while explicit sign-out permits starting again.
5. **US1-AC5**: Remember-session behavior, expiry/password-change notices and role routing remain consistent with existing session behavior; non-email service failures are not mislabeled SMTP failures.

### User Story 2 — Register a permitted account (Priority: P1)
People create only a learner or instructor account with clear validation and confirmation.
**Why this priority**: Registration creates data and must distinguish validation, conflict and an uncertain network outcome.
**Independent Test**: Register both supported roles and recover from a confirmed registration with failed identity verification.
**Acceptance Scenarios**:
1. **US2-AC1**: Registration offers only STUDENT/INSTRUCTOR; normalized name2–80, valid normalized email and untrimmed password6–72 match existing rules, including raw surrounding spaces on names.
2. **US2-AC2**: Duplicate-email conflict retains useful input and provides normal sign-in recovery; uncertain network failure does not assert the account was not created or automatically repeat registration.
3. **US2-AC3**: Confirmed account creation remains distinguishable from subsequent verification failure; pending creates once and old results cannot replace another identity.

### User Story 3 — Request password recovery (Priority: P1)
People request recovery without disclosing whether an address belongs to an account.
**Why this priority**: Delivery and throttling feedback must remain honest and private.
**Independent Test**: Valid/invalid requests, generic success, unavailable email service and rate limiting remain distinct.
**Acceptance Scenarios**:
1. **US3-AC1**: Valid entry requests recovery once, preserves the generic server-confirmed result without asserting account existence or actual email delivery, and offers return to sign-in.
2. **US3-AC2**: Invalid email sends nothing; service unavailable, throttling and network/server failure have operation-specific recovery without automatic resend or invented retry countdown.
3. **US3-AC3**: Pending disables conflicting actions; switching context/departure suppresses old success/error and retains no password in the recovery form.
4. **US3-AC4**: Existing recovery address semantics survive direct links, refresh and back/forward; registration remains page-local and does not gain a new URL contract.

### User Story 4 — Reset safely from an existing link (Priority: P1)
People distinguish an unusable link from correctable password input and understand confirmed or uncertain outcomes.
**Why this priority**: Reset changes credentials and revokes old sessions.
**Independent Test**: Missing/malformed/expired/used links, valid password boundaries, failed request and confirmed reset.
**Acceptance Scenarios**:
1. **US4-AC1**: Missing or malformed link disables reset and offers a new-link request; a changed link starts a separate form lifetime with no prior password, error or completion leaking into it.
2. **US4-AC2**: Password6–72 and exact confirmation validate before sending without trimming; validation failure keeps the link usable and focuses the associated field.
3. **US4-AC3**: Only explicit existing invalid/expired/used-link rejection produces invalid-link recovery; a general validation400 or other operation failure must not disable a potentially valid link.
4. **US4-AC4**: Pending prevents duplicate reset and conflicting controls. Confirmed success clears values, disables further reset and offers sign-in; production revocation and reauthentication behavior remain authoritative.
5. **US4-AC5**: Uncertain network failure retains the necessary mounted form values, explains uncertainty, offers normal sign-in or new-link recovery and never automatically replays reset.
6. **US4-AC6**: Departure/session/link replacement suppresses late results. Passwords and reset tokens never enter persistent drafts, logs, screenshots, recorded URLs or evidence artifacts.

### User Story 5 — Accessible, consistent desktop entry (Priority: P2)
People recognize the active task and complete it with keyboard controls and visible recovery feedback.
**Why this priority**: Entry forms must remain readable and usable alongside the completed LMS screens.
**Independent Test**: Four forms at both desktop sizes with long input/error content and keyboard-only navigation.
**Acceptance Scenarios**:
1. **US5-AC1**: At1280×800 and1440×900,100% zoom, each form prioritizes title, labelled fields, primary action and recovery without horizontal overflow or obscured controls.
2. **US5-AC2**: Labels/autocomplete/described field errors, visible keyboard focus, password visibility state and concise status/alert messages work; no decorative content displaces the task.
3. **US5-AC3**: Mode changes preserve non-secret name/email drafts within the entry lifetime, clear passwords/visibility/errors, focus the new task and preserve a permitted return destination; refresh/departure ends drafts.
4. **US5-AC4**: Authentication recovery and all001–007 role/course/document/assignment/quiz/account/admin boundaries retain their existing behavior.
5. **US5-AC5**: Every acceptance maps to tasks and typed evidence; missing real email delivery stays explicit, and fixtures do not become live SMTP evidence.

### Edge Cases
- EC01: Raw padded names, password significant spaces, empty/overlength input, long email and multi-line errors.
- EC02: Same-tick repeated activation, editable modes versus pending writes, browser history while pending and unmount.
- EC03: Confirmed registration/sign-in but verification503/network/401; retry versus explicit sign-out.
- EC04: Wrong-credential401 versus actual session expiry; newer identity during an old request.
- EC05: Recovery generic success does not establish delivery; service503, throttled429, cooldown/unknown email remain server-owned.
- EC06: Reset validation400 differs from explicit invalid/expired link400; unknown400 remains recoverable.
- EC07: Reset link changes after error/success or while pending; no old state/secret survives.
- EC08: Network uncertainty after server may have processed a mutation; no replay/idempotency claim.

## Requirements
### Functional Requirements
- **FR-001**: Preserve existing authentication, verified identity, permitted roles and resource/session boundaries. (US1-AC1/2/5;US5-AC4)
- **FR-002**: Make login/register/forgot/reset tasks and primary/recovery actions distinct and consistent with Lumina desktop hierarchy. (US5-AC1)
- **FR-003**: Match each operation's existing normalized name/email and untrimmed password validation; do not introduce a new password policy or unsupported email limit. (US1-AC2;US2-AC1;US3-AC2;US4-AC2)
- **FR-004**: Offer public registration only for STUDENT/INSTRUCTOR. (US2-AC1)
- **FR-005**: Associate field errors and distinguish them from operation failures, confirmed success, pending and verification recovery. (US1-AC2/4;US3-AC2;US4-AC2/3;US5-AC2)
- **FR-006**: Gate duplicate/conflicting actions synchronously during each request and identity verification. (US1-AC3;US2-AC3;US3-AC3;US4-AC4)
- **FR-007**: Scope all effects, credential installation and navigation to current operation/mode/link/mounted/session lifetime. (US1-AC3;US2-AC3;US3-AC3;US4-AC1/6)
- **FR-008**: Preserve verified safe return navigation and existing role fallbacks/remember behavior. (US1-AC1/5;US5-AC3)
- **FR-009**: Distinguish confirmed credential/account creation from failed identity verification; block writes and offer identity-read retry or explicit sign-out. (US1-AC4;US2-AC3)
- **FR-010**: Preserve wrong-credential versus session-expiry handling; old unauthorized results cannot expire a replacement session. (US1-AC2/3/5)
- **FR-011**: Preserve generic recovery response without account-existence or actual-delivery claims, and describe operation-specific503/429/network failures. (US3-AC1/2)
- **FR-012**: Keep existing forgot-link and reset-link semantics, page-local registration and predictable refresh/history behavior. (US3-AC4;US4-AC1;US5-AC3)
- **FR-013**: Separate missing/malformed and explicitly rejected reset links from correctable input/general request errors. (US4-AC1/2/3)
- **FR-014**: Preserve confirmed reset completion, password clearing, normal sign-in and server revocation semantics. (US4-AC4)
- **FR-015**: Explain uncertain mutation outcomes, preserve necessary drafts, and offer explicit recovery without automatic password/registration/recovery replay. (US2-AC2;US3-AC2;US4-AC5)
- **FR-016**: Keep passwords only for the necessary mounted form lifetime; clear on mode/link/session/departure boundaries and never persist/log/capture passwords/tokens. (US3-AC3;US4-AC6;US5-AC3)
- **FR-017**: Provide keyboard/labels/autocomplete/visibility/described errors/focus and long-content layout at both desktop sizes. (US5-AC1/2/3)
- **FR-018**: Preserve001–007 and current APIs/backend/schema/rate limits/dependencies; no OAuth/MFA/new account capability or mobile work. (US5-AC4)
- **FR-019**: Trace every acceptance to evidence; distinguish component/source/production HTTP/browser and real email delivery, preserving unrelated baseline failures. (US5-AC5)

### Key Entities
- Entry draft: local non-secret name/email and transient password; no durable form draft.
- Operation: task/context/session scope, pending/field/operation/confirmed/uncertain state.
- Verified session: server-verified identity and current generation, never inferred from entry response alone.
- Reset-link context: current link identity, validity and completed state; secret value not recorded.

## Success Criteria
### Measurable Outcomes
- **SC-001**: All8form×viewport cases show readable labelled controls/actions with zero page horizontal overflow and no overlapping long content.
- **SC-002**: Every invalid/duplicate/conflicting-action case issues the expected zero or one mutation with associated feedback.
- **SC-003**: Every delayed response/context/session replacement case produces zero stale identity, navigation, draft or completion effects.
- **SC-004**: Every confirmed-entry/failed-verification case distinguishes outcomes and retries identity reads only.
- **SC-005**: Every forgot/reset failure distinguishes correctable input, unusable link, throttling/service failure and uncertainty without false delivery/existence claims or replay.
- **SC-006**: Keyboard users can complete task switching, input, visibility, submission and recovery with visible focus and accessible messages.
- **SC-007**: Role navigation, revocation and001–007 regressions retain suitable evidence, and required frontend/backend checks pass or retain precise blockers.
- **SC-008**: All23acceptance scenarios link to task/evidence/status; real SMTP unavailability is explicit and no secret appears in artifacts.

## Assumptions
- Existing email/password authentication and session verification are authoritative; no policy/backend change is authorized.
- Preserve name/email locally across modes, clear passwords/visibility/errors at boundaries; pending disables mode controls. Browser departure may still leave a server-processed operation.
- Registration stays page-local; forgot supports its existing query and reset uses its existing link. Return state survives intentional form switching.
- Existing SMTP is Gmail-specific. No credentials or authorized real recipient are available; production503/429 and reset lifecycle can be tested in the isolated stack, but actual email delivery remains unverified.
- Test-account provisioning/reset-token preparation is permitted only in an isolated verified database; it is a labelled fixture, not evidence of email delivery.
- Desktop only; existing React/CSS/dependencies and server contracts are retained.

# Feature Specification: Google sign-in for existing accounts

**Feature**: `010-add-google-sign-in` (official script allocation; independent of Git branch)
**Created**: 2026-11-07
**Status**: Clarified
**Input**: Add Google/Gmail sign-in only for existing Lumina accounts; preserve password auth and the two-column screen.

## Clarifications

### Session 2026-11-07

- Q: What happens without a Lumina account? → A: Latest user correction: only existing accounts may sign in; Google must never create users. This supersedes the earlier STUDENT creation answer.
- Q: Automatically match existing accounts by email? → A: No; owners sign in with password and explicitly link Google first.
- Q: Is Google configuration available? → A: No; prepare private configuration instructions and keep real provider acceptance pending.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deliberately link an existing account (Priority: P1)

An authenticated ADMIN, INSTRUCTOR or STUDENT links their verified Google identity from Account. The normalized email must match their Lumina email. Password, role and learning data remain intact.

**Why this priority**: Establish ownership before granting Google access.
**Independent Test**: An owner links a matching identity; another identity/user/session cannot replace or steal it.

**Acceptance Scenarios**:

1. **Given** an active password-authenticated account without a link, **When** its owner explicitly links a matching verified Google identity, **Then** the link persists and password login still works.
2. **Given** a missing, revoked or expired session, **When** linking is submitted, **Then** no link changes.
3. **Given** mismatched email, an identity linked elsewhere or a different existing link, **When** submitted, **Then** linking is rejected without changing either account.

### User Story 2 - Sign in to the previously linked account (Priority: P1)

An owner uses the Google button, verifies their Lumina session and reaches the current role destination.

**Independent Test**: Linked active identities enter their original accounts; unknown, unlinked and disabled identities get no session and create zero users.

**Acceptance Scenarios**:

1. **Given** a linked active account in each role, **When** Google authentication succeeds, **Then** the same account/current role is used and the session is verified before navigation.
2. **Given** no link, even with an email matching an existing account, **When** Google authentication is submitted, **Then** access is denied with guidance to use password sign-in and Account linking; zero users/links are created.
3. **Given** invalid, expired, tampered, wrong-recipient, replayed or cross-browser evidence, **When** submitted, **Then** no session is issued.
4. **Given** departure, logout or a replacement session while pending, **When** a late response arrives, **Then** it cannot install credentials or navigate the new session.

### User Story 3 - Configure optional Google access privately (Priority: P2)

Operators can configure Google privately; users retain password access when Google is unavailable.

**Independent Test**: Missing configuration honestly reports unavailable; configured users can access the official button without mailbox permissions.

**Acceptance Scenarios**:

1. **Given** missing configuration, provider cancellation/loading failure or network failure, **When** Google is visited/attempted, **Then** an accessible status/retry is shown without fake success or automatic write replay.
2. **Given** the configuration guide, **When** a client and authorized site origins are configured outside chat, **Then** secrets/provider tokens never enter commits or evidence.

### Edge Cases

- Concurrent linking must resolve atomically; one Google identity belongs to at most one account.
- Linking requires matching verified email; later sign-in uses the established stable identity, never email-based reassignment.
- Challenge expiry, server restart or cookie loss requires a fresh explicit attempt.
- An uncertain linking response prompts a read-only status check, never an automatic mutation retry.
- Locking, role changes and password-reset session revocation remain authoritative.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Google MUST authenticate only an existing explicitly linked active account; MUST NOT create users or automatically link by email.
- **FR-002**: Linking MUST require an authenticated active owner, matching normalized verified Google email and an explicit Account action. Links MUST be unique and never overwrite another identity.
- **FR-003**: Authentication MUST verify provider signature, intended recipient, issuer, expiry, stable identity, verified email and a browser-bound single-use five-minute challenge; invalid evidence fails closed before mutation/session issuance.
- **FR-004**: Current role, active state and revocation remain server-authoritative for all three roles.
- **FR-005**: Preserve password sign-in, public STUDENT/INSTRUCTOR registration, forgot/reset, untrimmed passwords and reset session revocation.
- **FR-006**: Google success enters existing session verification/role navigation; pending/stale callbacks cannot overwrite newer sessions; verification recovery never resubmits authentication.
- **FR-007**: Preserve two columns; add Google only to sign-in and explicit linking to Account, with accessible loading/unavailable/error/success/retry states and desktop checks at 1280×800 and 1440×900.
- **FR-008**: Missing configuration/provider failure cannot block password flows or claim success. Logs/evidence cannot retain provider tokens, credential requests, passwords or browser profiles.
- **FR-009**: Document authorized origins/private setup, distinguish public identifier from secrets and request no Gmail inbox/send permissions.
- **FR-010**: Distinguish fixture tests, isolated HTTP/database, hosted CI and actual Google UI acceptance; missing real configuration keeps provider acceptance open.
- **FR-011**: The localhost:5173 frontend must reach the real API through restricted allowed origins; preserve existing data and local8081 resources.

### Key Entities *(include if feature involves data)*

- **Existing account**: Lumina identity/password/current role/active flag/revocation version, optionally owning one stable Google identity.
- **Google link**: Unique stable provider identity deliberately associated with one existing account; no provider access/refresh tokens retained.
- **Challenge**: Browser/intent-bound one-time proof with five-minute expiry; linking also binds the owner and revocation version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three roles retain password access and, after deliberate linking, Google access to the same account/permissions.
- **SC-002**: Every unknown/unlinked, disabled, mismatched, replayed and stale-session matrix case is denied; Google creates zero accounts.
- **SC-003**: Both desktop sizes retain two columns, keyboard access, visible controls and no horizontal overflow.
- **SC-004**: Required package/isolated integration checks pass; actual Google acceptance is separately passed or pending with its exact prerequisite.

## Assumptions

- Google is optional; missing operator configuration gates actual provider acceptance, not implementation/fixture tests.
- Browser/API share an origin through a proxy. Separate-origin cookie deployments require separate configuration review.
- One application instance holds short-lived challenges; restart invalidates them safely. Distributed storage and unlink/relink administration are out of scope.
- No other OAuth provider, account provisioning, Gmail integration, redesign, external AI or notifications.
- Feature 008 retains its own T023 evidence and T026 cleanup limitation; no cleanup retry here.

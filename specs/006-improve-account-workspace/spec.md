# Feature Specification: Account and Password Workspace

**Feature Branch**: `006-improve-account-workspace` (artifact ID, independent of Git branch)
**Created**:2026-11-01
**Status**: Clarified
**Input**: Improve account identity, display-name editing and password management for ADMIN, INSTRUCTOR and STUDENT without new account capabilities.

## Clarifications

### Session 2026-11-01

- Q: After a confirmed profile save followed by identity-verification failure, retain the account view read-only or show full-page recovery? → A: Retain the account view read-only (option A), with all writes blocked until verification succeeds.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand identity and edit display name (Priority: P1)

An authenticated user of any current role recognizes their account and edits their display name without confusing routine profile work with password changes.

**Why this priority**: Identity and name editing are the primary account actions.
**Independent Test**: Open each role's account, inspect read-only identity and submit boundary/normal names.

**Acceptance Scenarios**:

1. **US1-AC1**: Given an authenticated ADMIN/INSTRUCTOR/STUDENT, when account opens, then current name, email and translated role are clear, email/role remain read-only, profile editing is primary and the password form starts collapsed.
2. **US1-AC2**: Given an invalid trimmed name outside2–80 characters, when saving, then no request is issued and an associated field error explains the rule; a valid name is trimmed for submission.
3. **US1-AC3**: Given a pending name save, when save is activated repeatedly or password submission is attempted, then only one account write is active, pending is announced and the name remains editable for a newer draft.
4. **US1-AC4**: Given a confirmed name save, then the normalized saved value is identified; edits made after submission, including editing away and back, are not overwritten by the earlier response. The header updates only through current identity verification.
5. **US1-AC5**: Given the same mounted account, then name drafts survive request errors/retry and disclosure activity; leaving the account or changing authenticated identity ends that local draft lifetime.

### User Story 2 - Recover honestly from save and verification failures (Priority: P1)

The user can distinguish saved data from failed identity verification, retry reads without resending writes and avoid stale identity after leaving or signing out.

**Why this priority**: A saved update followed by verification failure must not look like an unsaved write or restore an old session.
**Independent Test**: Delay/fail profile save and subsequent identity verification, edit meanwhile, retry and sign out or change users.

**Acceptance Scenarios**:

1. **US2-AC1**: Given a confirmed save followed by identity-check failure, then the known account view remains visible read-only, saved status and failed verification are separately explained, the newer name draft is preserved within the account recovery lifetime, protected writes are blocked until verified, and retry checks identity without repeating the save.
2. **US2-AC2**: Given an uncertain save network failure, then input remains and the user can verify current identity before explicitly saving again; no automatic write replay or assertion that nothing was saved is made.
3. **US2-AC3**: Given logout, navigation, session expiry or account replacement during a request, then late save/read/error/finally responses do not overwrite the new screen, restore cached identity, navigate a new user or clear their draft.
4. **US2-AC4**: Given missing/invalid/expired credentials, then existing sign-in/recovery and role routing remain effective; network/5xx failures do not become false expiry or grant unverified access.

### User Story 3 - Manage passwords separately and safely (Priority: P2)

The user deliberately opens a compact password form, receives precise validation/error feedback and understands reauthentication after a confirmed change.

**Why this priority**: Password work is consequential and less frequent than name editing.
**Independent Test**: Exercise form lifecycle, boundaries, wrong-current response, pending duplicates, uncertain failure and confirmed logout using isolated synthetic fixtures.

**Acceptance Scenarios**:

1. **US3-AC1**: Given collapsed password management, when opened, then current/new/confirmation fields are labeled with appropriate autocomplete and existing6–72-character rules. Closing clears password values; disclosure changes never submit. Closing and other account writes are disabled while a password change is pending.
2. **US3-AC2**: Given missing/out-of-range passwords, new equal to current, or confirmation mismatch, then no request is sent and the relevant field is identified. Passwords are never trimmed.
3. **US3-AC3**: Given a wrong-current-password response, then its specific error is associated with that field; other request failures are operation errors, not mislabeled invalid passwords. Failed changes retain necessary values only while the same form remains mounted.
4. **US3-AC4**: Given pending change, then inputs and conflicting actions are disabled and duplicate activation issues one request. Confirmed success clears values, signs out and leads to sign-in with the current password-changed explanation.
5. **US3-AC5**: Given an uncertain network failure, then do not assert the change failed to occur or automatically resend. Offer a read-only session check or normal sign-in as recovery; invalidated sessions follow existing expiry behavior.
6. **US3-AC6**: Given form closure, account departure, user/session replacement or loss of verified account state, then password fields are cleared/unmounted and never persisted in storage, URLs, logs or artifacts. Late results cannot sign out another account.

### User Story 4 - Preserve accessible desktop and LMS boundaries (Priority: P2)

Account improvements remain usable and consistent without changing other learning or authorization flows.

**Why this priority**: Shared navigation/session behavior affects the whole LMS.
**Independent Test**: Real-role desktop/keyboard checks and component/router regression of authentication and existing learning areas.

**Acceptance Scenarios**:

1. **US4-AC1**: At1280×800 and1440×900, zoom100%, all three roles see identity and profile actions before the collapsed password form; long identity/error content wraps without horizontal page overflow.
2. **US4-AC2**: Keyboard users can edit/save/open/close/retry/sign out with visible focus, labels, autocomplete, described field errors and concise pending/error/success announcements. Opening focuses the first password field and closing returns focus to its trigger.
3. **US4-AC3**: Existing authentication/role navigation, dashboard, course/lesson/protected document, assignments/grading, quiz autosave/version/leave and local study panels retain their contracts and boundaries; ADMIN gains no course-content access.
4. **US4-AC4**: Every acceptance scenario maps to tasks/evidence with passed/failed/not-run status. Missing live conditions keep precise tasks open and earlier feature tasks untouched.

### Edge Cases

- **EC-01**: Whitespace names, exact2/80 and out-of-range names, long email/name; password spaces are significant.
- **EC-02**: Same-tick duplicates and competing profile/password actions; edit away and back during save.
- **EC-03**: Save200 then identity503/network/401; read retry must not replay the write; uncertain write may already have committed.
- **EC-04**: Logout/account replacement/unmount before profile or password responses; late invalid-session responses must not invalidate a newer login.
- **EC-05**: Password mismatch/same-as-current/wrong-current, pending disclosure close, empty remount and uncertain change with revoked session.
- **EC-06**: Keyboard focus after disclosure or failed validation, long error text, no secret serialization.
- **EC-07**: Startup loading/error differs from a known account awaiting revalidation; all protected writes remain gated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preserve own-account authentication and existing role/resource boundaries for all three roles. (US1-AC1;US2-AC4;US4-AC3)
- **FR-002**: Prioritize read-only identity/email/role and compact name editing above initially collapsed password management. (US1-AC1;US4-AC1)
- **FR-003**: Validate trimmed names2–80 characters before requests and associate field errors. (US1-AC2)
- **FR-004**: Serialize account writes with immediate duplicate prevention; keep name editing possible while its save is pending. (US1-AC3;US3-AC4)
- **FR-005**: Preserve newer name edits against older responses and identify the actual confirmed saved value. (US1-AC4)
- **FR-006**: Keep name drafts local to the same account lifecycle; no durable draft storage. (US1-AC5)
- **FR-007**: Distinguish confirmed profile save from failed identity verification; preserve the newer draft and offer read-only retry while writes remain gated. (US2-AC1)
- **FR-008**: Treat uncertain profile failure honestly, retaining input and providing identity check before explicit resend. (US2-AC2)
- **FR-009**: Scope every account request/result/cache effect to the same authenticated session/account and mounted lifetime; late old-session401 must not clear a newer session. (US2-AC3;EC-04)
- **FR-010**: Keep current identity verification, expiry routing and recoverable network/5xx behavior; do not grant new authenticated access. (US2-AC4)
- **FR-011**: Password disclosure opens intentionally, focuses its first field, clears on close and prevents close during pending mutation. (US3-AC1;US4-AC2)
- **FR-012**: Validate untrimmed password6–72 lengths, new/current inequality and exact confirmation before sending. (US3-AC2)
- **FR-013**: Distinguish wrong-current field errors, validation errors and operation failures; retain values only in the current necessary form lifetime. (US3-AC3)
- **FR-014**: Confirmed password success clears values and preserves existing logout/relogin message and server-revocation semantics; stale success cannot affect another account. (US3-AC4/6)
- **FR-015**: Uncertain password failures offer explicit read/sign-in recovery, with no auto replay or unsupported outcome claim. (US3-AC5)
- **FR-016**: Clear/unmount password values at disclosure/account/session boundaries; never persist/log/include them in artifacts. (US3-AC6)
- **FR-017**: Use keyboard-accessible controls, visible focus, autocomplete, described errors and distinct pending/success/error/disabled states. (US4-AC2)
- **FR-018**: Scope desktop styling and preserve existing learning/session/navigation contracts without broad redesign or dependencies. (US4-AC1/3)
- **FR-019**: Preserve baseline failures separately and link every acceptance to appropriately typed evidence; leave blocked checks/prior-feature tasks open. (US4-AC4)

### Key Entities *(include if feature involves data)*

- **Verified account**: Current public identity id/name/email/role; only name is editable here.
- **Name draft**: Local text/edit lifetime and distinct confirmed saved value.
- **Operation state**: Saving, confirmed, uncertain, verifying, verification failure and recovery for one account.
- **Password form**: Ephemeral current/new/confirmation values and associated errors, cleared at its lifetime boundaries.
- **Session identity**: Current authenticated account generation; determines whether pending results may affect UI/cache.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six role×viewport cases at100% zoom prioritize identity/profile with password initially collapsed, no horizontal overflow and reachable controls for long content.
- **SC-002**: Every boundary/duplicate/competing-write case issues the expected zero or one mutation and correct field or operation feedback.
- **SC-003**: Every delayed save/verify/logout/account-switch scenario preserves newer name edits where specified and produces zero stale UI/cache/session effects.
- **SC-004**: Every confirmed-save/read-failure recovery distinguishes outcomes and issues read retries only, without repeating writes.
- **SC-005**: Every password lifecycle/validation/success/uncertainty case preserves logout semantics and leaves no password values in persistent client storage or artifacts.
- **SC-006**: Keyboard-only users can complete profile/disclosure/recovery with visible focus and accessible messages; current role and LMS regression matrices have properly typed evidence.
- **SC-007**: All19 acceptance scenarios have traceability/status/reasons; required frontend checks and missing live acceptance remain explicit rather than inferred from fixtures.

## Assumptions

- Existing React/CSS/dependencies and desktop only. No new APIs, data fields, backend/schema/migration or permission changes; no email/role editing, OAuth/MFA/avatar/account deletion/notifications/analytics/external AI.
- Closing the password disclosure ends its form lifetime and clears values. Profile and password mutations do not run concurrently.
- Keep the previously verified account view visible read-only during post-save identity verification/loading/failure; retain name draft and saved confirmation. All writes remain blocked until verification succeeds. Initial unverified startup and other protected routes keep their current guards.
- Startup without a previously verified identity still uses current loading/recovery; no cached identity grants access.
- Current live profile writes require identified safe accounts/operations; live password entry/change is performed by the user. No provisioning/seed/reset/delete to manufacture evidence.

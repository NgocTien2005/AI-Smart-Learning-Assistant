# Feature Specification: ADMIN Account Workspace

**Feature Branch**: `007-improve-admin-workspace` (artifact ID, independent of Git branch)
**Created**:2026-11-01
**Status**: Specified
**Input**: Improve existing ADMIN account discovery, selected-account editing and recovery; no new account capabilities.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and select accounts (Priority: P1)

ADMIN scans a compact account list before deliberately opening one account's editing controls.
**Why this priority**: Repeated full forms obscure discovery and identity.
**Independent Test**: Search, paginate and select from populated/empty/error results.

**Acceptance Scenarios**:
1. **US1-AC1**: Given successful results, then name, email, current role and active/locked status are readable, account-list actions precede the compact selected editor, and no account editor opens automatically.
2. **US1-AC2**: Given search or page changes, then supported name/email search and authoritative pagination are preserved; earlier results never appear as confirmed results for a newer request.
3. **US1-AC3**: Given a selected account, when another is selected or its editor closed, then at most one editor is visible, the selected target is explicit and each account's unsaved draft remains local to the mounted administration page.
4. **US1-AC4**: Given initial loading/error, empty accounts, no search matches or failed reload, then each has distinct feedback; previous results are labeled, missing totals are not shown as zero, and retry only reads.

### User Story 2 - Edit precisely and recover (Priority: P1)

ADMIN edits the permitted display name and role without losing drafts or confusing a confirmed update with a failed list refresh.
**Why this priority**: Updates affect real accounts and must remain unambiguous.
**Independent Test**: Validate, delay, reject and confirm updates, then fail/retry their reload.

**Acceptance Scenarios**:
1. **US2-AC1**: Given selected account editing, then only supported display-name and instructor/student role controls are editable; email and confirmed identity/status/statistics are read-only. Invalid trimmed names outside2–80 or unsupported roles issue no write.
2. **US2-AC2**: Given a pending operation, then its account's conflicting actions and fields are disabled immediately; repeated activation produces one write, while switching to another account remains possible.
3. **US2-AC3**: Given validation, role conflict or network failure, then draft survives; field and operation failures remain distinct, role-conflict feedback explains linked courses/enrollments and no mutation is replayed automatically.
4. **US2-AC4**: Given a confirmed update followed by failed reload, then a target-specific saved confirmation remains separate from reload failure; read retry does not repeat the update and another account's selection/draft is unaffected.
5. **US2-AC5**: Given an updated account no longer matching search or a last page that disappears, then the authoritative remaining page is loaded, a filtered-out editor closes without discarding its local draft, no unrelated account is automatically selected and old results cannot undo confirmed state.

### User Story 3 - Confirm consequential actions and retain boundaries (Priority: P1)

ADMIN understands role changes and lock/unlock effects while server authorization remains authoritative.
**Why this priority**: Role/status changes affect access and existing sessions.
**Independent Test**: Confirm/cancel role and lock actions, simulate denial and session replacement.

**Acceptance Scenarios**:
1. **US3-AC1**: Given role change or lock/unlock, then existing confirmation identifies the target, proposed action and relevant access/session effect; cancellation writes nothing and returns focus. Routine name-only save does not gain a confirmation step.
2. **US3-AC2**: Given lock/unlock while a name/role draft exists, then only the active-state mutation is sent and the unsaved profile draft remains; current server self-edit/managed-role/linked-record restrictions are preserved.
3. **US3-AC3**: Given lost ADMIN authorization, expiry, logout, account replacement or navigation, then protected operations stop and late reads/writes/errors cannot alter another session, restore old data or navigate the new user.
4. **US3-AC4**: Given INSTRUCTOR/STUDENT visiting administration or ADMIN visiting course content, then existing route/server denial remains; no new account/course capabilities are introduced.

### User Story 4 - Accessible desktop and evidence (Priority: P2)

ADMIN can use the workspace by keyboard without disrupting existing Lumina flows.
**Why this priority**: Discovery/editing changes must remain accessible and verifiable.
**Independent Test**: Desktop/keyboard checks plus complete frontend and permitted system regressions.

**Acceptance Scenarios**:
1. **US4-AC1**: At1280×800 and1440×900,100% zoom, long identities/errors wrap without horizontal page overflow; list and search remain primary, the editor is reachable and controls are not obscured.
2. **US4-AC2**: Labels, focus indication, keyboard selection/disclosure, described errors, pending/success announcements and native confirmation focus/cancel behavior work.
3. **US4-AC3**: Administration retains its existing in-memory URL lifecycle: refresh/departure resets local search/page/selection/drafts; back/forward keeps existing route behavior. Account006 recovery and all existing LMS/session/quiz protections regress without changing their implementation.
4. **US4-AC4**: Every acceptance maps to tasks and typed evidence; baseline failures and earlier feature acceptance remain separate, and unavailable live checks stay open.

### Edge Cases
- EC01: Trimmed search120 limit, whitespace-only input, rapid search/page changes, page clamp after rename.
- EC02: Missing statistics versus valid0; long name/email/error and filtered-out selection.
- EC03: Same-tick duplicate or competing save/lock on one account; independent accounts pending concurrently.
- EC04: Role conflict409, validation400, missing target404, access403, explicit session401 and uncertain network/5xx.
- EC05: Confirmed write then reload failure; old GET before/between writes; old target response after new selection.
- EC06: Close/reopen/switch drafts, confirmation cancel/Escape/focus, route/account/session lifetime ends.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Preserve ADMIN-only managed-account access and all existing server/resource boundaries. (US3-AC2–4)
- **FR-002**: Preserve current name/email search, normalized query limit, server ordering and pagination; expose no unsupported role/status filters. (US1-AC2)
- **FR-003**: Distinguish initial/reload loading, empty/no-match, error/read retry, pending and confirmed success with accurate totals. (US1-AC4)
- **FR-004**: Prioritize a compact list and explicit single-account selection, with no automatic selection. (US1-AC1/3)
- **FR-005**: Limit editable fields to existing managed name/role and separate lock/unlock; other returned metadata is read-only. (US2-AC1;US3-AC2)
- **FR-006**: Validate trimmed name2–80 and allowed managed roles before writes; field feedback is associated. (US2-AC1)
- **FR-007**: Preserve per-account drafts across close/switch/search/page/errors for the same administration lifetime; no persistent draft storage. (US1-AC3;US2-AC3)
- **FR-008**: Serialize operations per account with immediate duplicate/conflicting-action gates; allow independent account work. (US2-AC2;EC03)
- **FR-009**: Preserve target-specific role/lock/unlock confirmation, cancel/focus and name-only direct save. (US3-AC1)
- **FR-010**: Separate confirmed mutation success from reload failure; retries only read and confirmed target state survives failed reads. (US2-AC4)
- **FR-011**: Keep validation/conflict/operation/uncertain failure distinct, retain drafts and avoid automatic replay or unsupported outcome claims. (US2-AC3)
- **FR-012**: Scope reads to current query/page/request, reconcile authoritative pages and close filtered-out selection without choosing another account. (US1-AC2;US2-AC5)
- **FR-013**: Scope mutation outcomes to target/account/session/mounted lifetime, preserving other drafts and preventing old reads undoing confirmed state. (US2-AC4/5;US3-AC3)
- **FR-014**: Stop operations on authorization loss/expiry; preserve current recoverable session routing and prevent stale-session effects. (US3-AC3/4)
- **FR-015**: Display only returned identity/role/status/date/count metadata; distinguish absent count from0 and confirmed role from draft role. (US1-AC1;US2-AC1)
- **FR-016**: Provide keyboard/focus/label/described-error and native-dialog accessibility with readable long desktop content. (US4-AC1/2)
- **FR-017**: Preserve current in-memory administration route lifecycle and existing account/learning regressions. (US4-AC3)
- **FR-018**: Keep frontend/dependencies/server contracts unchanged outside scope; preserve baseline and link all acceptance to honest evidence, leaving missing live acceptance open. (US4-AC4)

### Key Entities
- Managed account: returned instructor/student public identity, active state and supported related counts.
- Result snapshot: confirmed query/page/list/total, separate from pending search input.
- Selected account: explicit account target and optional compact editor.
- Local draft: per-account name/role, dirty state and current lifetime.
- Operation outcome: pending, confirmed target result, uncertain/validation/conflict failure, separate reload state.
- Confirmation: target and proposed mutation captured for deliberate approval.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Both desktop sizes show list/search before one optional editor, with no page overflow or obscured control in long-content cases.
- **SC-002**: Every invalid/cancel/duplicate/competing-action case issues the expected zero or one write and accurate associated feedback.
- **SC-003**: Every delayed search/page/read/write/session-change scenario produces zero stale target/session/draft effects.
- **SC-004**: Every saved-but-reload-failed case retains target-specific confirmation and retries only reads, including filtered-out/page-clamp cases.
- **SC-005**: All existing authorization/managed-role/self-edit/session boundaries remain; live role/status changes are user-performed on designated existing test resources.
- **SC-006**: Keyboard selection/edit/close/retry/confirmation works with visible focus; administration lifecycle and existing account/LMS regression cases have typed evidence.
- **SC-007**: All17 acceptance scenarios have task/evidence/status; complete frontend check outcomes and unavailable live evidence remain explicit.

## Assumptions
- Existing search and page are the supported discovery controls; no role/status filter or email edit is added.
- Preserve current mounted-page draft retention, including close/switch/filter/page; route/session departure clears drafts. Refresh starts the current default view. No new URL parameters/deep links.
- Selection is deliberate; initially none. Close/switch never silently saves. Successful result omitting the target closes its editor and retains its local draft.
- Existing confirmation component is reused for role/status only. Server decides whether linked records prevent role changes; no new last-ADMIN rule.
- Existing React/CSS/dependencies, desktop only; no backend/schema/migration/API/permission changes, new account capability or external service.
- Live writes require designated existing accounts/operations; user performs live role/status changes. No provisioning/seed/reset/delete/commit/push/deploy.

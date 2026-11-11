# Feature Specification: Maintainable course module boundaries

**Feature Branch**: refactor/architecture-cleanup
**Created**: 2026-11-09
**Status**: Reviewed
**Input**: Portfolio A, AUD06/07. Behavior-preserving extraction.

## Problem, goals and non-goals

Course endpoints and workspace components combine independent responsibilities,
making permission and asynchronous behavior harder to review. Give maintainers
cohesive modules while preserving every current learning workflow. No redesign,
new API/schema/dependency, auth migration or speculative business-rule change.
Test-file reorganization belongs to the separate testing workstream.

## User Scenarios & Testing

### User Story 1 - Review server changes safely (Priority: P1)

Maintainers can locate assignment, lesson/document and course responsibilities
separately, including common ID/access and storage helpers.
**Independent Test**: Existing production HTTP/database matrix and quiz regressions.
**Acceptance Scenarios**:
1. Given current endpoints, when modules are extracted, then method/path/status,
   validation, response, authentication, owner/enrollment and cleanup stay unchanged.
2. Given a different instructor, unenrolled student or ADMIN, when accessing
   protected resources, then no newly granted access or unauthorized writes occur.

### User Story 2 - Maintain frontend state safely (Priority: P1)

Maintainers can reuse roster request lifecycle and assignment form helpers
without mixing network/validation logic into presentation.
**Independent Test**: Current component/navigation/draft suite and actual browser.
**Acceptance Scenarios**:
1. Given a course switch/unmount, when roster replies late, then old data cannot
   overwrite the current workspace; requests are cancelled and retry remains explicit.
2. Given existing drafts/quiz navigation, when code is extracted, then field
   validation, pending locks, URL selection and leave flush remain unchanged.

### Edge Cases

StrictMode cleanup, abort/retry, request reordering, bodyless commands, multipart
upload errors, route ordering, stale course IDs, existing legacy harness references.

## Requirements

### Functional Requirements

- **FR-001**: Separate server course/assignment/lesson responsibilities, preserving mounted production contracts and ownership.
- **FR-002**: Reuse common ID/access/storage helpers without changing validation or introducing ADMIN bypass.
- **FR-003**: Extract frontend roster lifecycle and assignment form functions; preserve async guards, drafts, quiz flush and URL state.
- **FR-004**: Audit legacy references and keep/remove only with production test coverage; do not silently delete referenced behavior.
- **FR-005**: Record module boundaries, behavioral regression and exact tested source; distinguish source/component/browser/DB evidence.

### Non-functional and security requirements

No new dependencies, migrations, UI/CSS/layout or provider requests. No user data
or existing volume changes. Smaller cohesive modules without controller/service
framework layers. Preserved authorization tested at actual HTTP/database boundary.

### Key Entities

Existing Course/Lesson/Assignment/Enrollment/QuizAttempt unchanged; roster request
has course identity, abort controller, mounted lifecycle and explicit reload input.

## Success Criteria

- **SC-001**: All existing HTTP/DB, backend and quiz checks pass after extraction.
- **SC-002**: All frontend tests/lint/build pass; real browser preserves three-role workflows at1280×800/1440×900.
- **SC-003**: Each extracted responsibility and legacy reference decision is documented and traceable to tests/commits.

## Clarifications

2026-11-09 all categories clear. Refactor only, no new behavior/layout. Legacy
harness cannot be removed on this independent branch while its tests still
reference it; security014 production test port is a separate PR dependency for
eventual removal. Do not cherry-pick unrelated auth code into this branch.

## Known constraints and compatibility

Base audit2891c11; no security014 code dependency. Changes later combined only in
a documented temporary integration branch, leaving main unchanged. Existing
provider/cleanup acceptance gates remain in original features.

## Compatibility follow-up - 2026-11-11

Original specification and acceptance history above are preserved. External merges moved the PR base to92e0585, which now includes014/016/017/018. The no-unrelated-auth-cherry-pick constraint still holds: the follow-up branches directly from this already verified base and reapplies only architecture015 code. Current security guards and production auth tests must be retained. Original PR7 is conflicting; replacement refactor/architecture-base-compatibility delivery is tracked by T007, without force-push, PR/main merge or new feature identifier. No new API/schema/layout/dependency or provider behavior.

# Feature Specification: Authentication abuse hardening

**Feature Branch**: security/auth-hardening
**Created**: 2026-11-09
**Status**: Reviewed
**Input**: Portfolio B, audit AUD01–05; no authentication migration.

## Problem, goals and non-goals

Malformed authentication requests currently cause server errors and repeated
credential/registration requests are unbounded. Protect legitimate users and
preserve existing password/Google/reset behavior. No cookie migration, password
policy change, schema change, provider acceptance, deployment or broad refactor.

## User Scenarios & Testing

### User Story 1 - Fail safely under malformed or abusive requests (Priority: P1)

As an operator I need bounded resource consumption and safe client errors.
**Independent Test**: Production HTTP requests with malformed bodies, repeated
credentials, rotating email and spoofed forwarded addresses exercise budgets.
**Acceptance Scenarios**:
1. Given absent/null/array/non-object mutation bodies, when sent, then400 JSON
   occurs before database access; oversized JSON returns413 rather than500.
2. Given repeated login/register/recovery/join attempts, when limits are reached,
   then429 JSON and Retry-After occur before expensive work; rotating email does
   not bypass aggregate origin budget and full storage rejects new keys safely.
3. Given elapsed budget windows, when retried explicitly, then access recovers
   without clearing other active budgets or permanent account lockout.

### User Story 2 - Preserve current authentication (Priority: P1)

As ADMIN/INSTRUCTOR/STUDENT I retain password sign-in and current role routing.
**Independent Test**: Production auth router/middleware tests plus isolated DB
integration, not legacy harness assertions.
**Acceptance Scenarios**:
1. Given valid credentials including surrounding password spaces, when signing
   in, then public user/token and current-user verification keep existing behavior.
2. Given public ADMIN registration or invalid/expired/revoked credentials, when
   used, then rejection occurs without exposing hashes or unauthorized changes.
3. Given a valid reset link, when submitted, then it is single use and revokes
   old sessions; invalid payload400 remains distinct from consumed-link400.

### Edge Cases

Shared proxy IP, spoofed forwarding headers, window rollover, limiter cardinality,
body parser failure, disabled users, missing email configuration, late reset races.

## Requirements

### Functional Requirements

- **FR-001**: Reject malformed mutation bodies before handlers; preserve multipart uploads and existing endpoint field validation.
- **FR-002**: Bound login/registration/recovery/password-change and join-code requests; quantify budgets in plan/contracts, return429/Retry-After and cap memory with expiry/fail-closed capacity.
- **FR-003**: Keep email normalization, untrimmed6–72-character passwords, public roles, generic forgot response and atomic reset revocation unchanged below budgets.
- **FR-004**: Exercise actual production auth handlers/current-user middleware with dependency injection; never treat duplicate legacy auth as proof.
- **FR-005**: Suppress framework banner, add safe API response headers and redact internal exception logging; preserve useful public error codes/statuses.
- **FR-006**: Document proxy assumptions and Bearer storage XSS/CSRF tradeoffs; cookie migration remains a separate coordinated change.

### Non-functional and security requirements

No new dependencies/schema/API success changes; budgets process-local and reset
on restart, explicitly unsuitable for unconfigured multi-replica use. No secret,
email address, raw authenticated request or token in limiter evidence/logs. No
real SMTP/Google/Gemini requests. Do not read or recreate private dev configuration.

### Key Entities

Rate bucket: hashed identity, count, expiry; strictly bounded cardinality.
Session: existing user/authVersion and signed Bearer credential, unchanged.

## Success Criteria

- **SC-001**: All malformed-body baseline cases become400; oversized413; valid contracts unchanged.
- **SC-002**: Every specified budget passes threshold, expiry, cardinality and spoofing regressions; rejected requests do no expensive work.
- **SC-003**: Production auth and existing backend/quiz/isolated integration checks pass, documented separately from hosted CI/provider acceptance.

## Clarifications

2026-11-09 all scope/privacy/data/compatibility categories clear from request.
Keep existing Bearer architecture and provider gates; numeric thresholds are
bounded single-process implementation defaults documented in plan, not SLA.

## Known constraints and compatibility

Default untrusted proxy means Nginx users share an IP budget; do not blindly trust
forwarded headers. No account-only permanent lockout. Existing data, migrations,
Google links and historical008T023/T026/010T016/012T012 remain untouched.

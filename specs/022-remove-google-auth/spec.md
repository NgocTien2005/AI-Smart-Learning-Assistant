# Feature Specification: Retire Google authentication

Created: 2026-11-16. Status: Approved for implementation by user request.
Branch: `refactor/remove-google-auth` (temporary stack on unmerged021; intended PR base `feat/gemini-lesson-chat`).

## Problem, goals and non-goals

An unavailable Google sign-in control confuses users. Remove OAuth login/linking from active code/config. Preserve email/password for ADMIN/INSTRUCTOR/STUDENT, Gmail SMTP and actual Gemini chat. No auth redesign, user deletion or historical migration/evidence rewrite.

## User Scenarios & Testing

### US1 - Password authentication without Google controls (P1)

Users sign in and manage accounts without unavailable Google controls.
Independent test: login each role, inspect auth/account and password recovery contract.
Acceptance: auth offers password login, registration and recovery, no GIS script; all three roles authenticate via login/me with unchanged routing; account profile/password work without linking requests.

### US2 - Retired provider interfaces with preserved data (P1)

Operators need no OAuth Client ID; Gemini/SMTP remain independently configured.
Independent test: old challenge/login/link return404 without provider requests/writes and fresh integration remains green.
Acceptance: anonymous/authenticated old endpoints return404; users/passwords/sessions and dormant subject data survive; current docs retire OAuth, historical acceptance is superseded rather than fabricated as passed.

### Edge Cases

Stale clients get404 and must reload, no fallback account creation/linking. Old OAuth env variables ignored. Historical column remains private unused storage. Google vendor references in Gemini privacy/Gmail are retained.

## Requirements

- FR001: Remove sign-in/linking UI, SDK loader, OAuth service/router and config/build arguments.
- FR002: Retired `/api/auth/google/{challenge,login,link}` methods return404; cannot authenticate or mutate users.
- FR003: Preserve email normalization, untrimmed passwords, public roles, me, authVersion, generic forgot, one-use reset and role/object authorization.
- FR004: Preserve database/migrations/data; dormant googleSubject never appears in public responses.
- FR005: Preserve Gemini/SMTP. No email sends or OAuth calls during tests.
- FR006: Update current setup/portfolio docs/tests, retaining historical010 evidence and cleanup limits.

## Non-functional and security requirements

No dependency/schema/migration changes; preserve rate limits/security middleware. Production server.js uses src/app.js, not legacy app.js. No secret logs/provider calls in CI. Use isolated verified HTTP/database integration. Inspect UI at1280x800 and1440x900 without redesign.

## Success Criteria

- SC001: Three roles log in, inspect accounts and log out; zero OAuth controls/SDK requests.
- SC002: All retired methods return404 in production-app and isolated HTTP/database tests.
- SC003: Frontend gates, backend/quiz, isolated integration pass; docs match runtime.

## Clarifications and compatibility

2026-11-16: No critical ambiguity. Latest user explicitly removes OAuth and requests Gemini. SMTP preserved by prior scope. This intentionally retires the OAuth API; dormant column avoids destructive migration. Existing accounts already have passwords; reset remains available. General OAuth acceptance010 is superseded, not marked successful.

# Implementation Plan: Authentication entry and recovery

**Feature**: 008-improve-auth-entry | **Date**:2026-11-03 | **Spec**: [spec.md](spec.md)
**Git branch**: main unchanged; selected by official feature resolver/state.

## Summary
Use a compact, scoped desktop form; match production validation; guard mounted/page/session lifetimes; separate accepted credentials from failed identity verification. Preserve APIs, session implementation, reset-link contract and001–007 behavior.

## Technical Context
- JavaScript/JSX, React19, React Router7, Vite8; existing CSS and shared Feedback components only.
- Express5/Prisma7/PostgreSQL production code is read-only scope; Node24+ for verification.
- Non-secret drafts remain page-local; passwords mounted-only; existing session storage remains owned by SessionContext/API client.
- Existing Node service tests, Vitest/jsdom/RTL, backend Node regression; real Chrome plus isolated Compose HTTP/database verification.
- Desktop1280×800 and1440×900 at100% zoom. Four forms, three verified account roles. No requests on field edits, polling or automatic mutation retries.
- No dependency/API/schema/migration/rate-limit/email-service changes.

## Constitution Check
| Principle | Before research and after design |
| --- | --- |
| I Contract | PASS: production trace, legacy differences documented. |
| II Authorization | PASS: /me, authVersion, roles and ownership server-owned. |
| III Recoverability | PASS: field/operation/verification/uncertainty and draft boundaries specified. |
| IV Evidence | PASS: full suites, typed browser/HTTP evidence; explicit SMTP gap. |
| V Integrity | PASS: clean baseline retained, isolated writes only, no schema/dependency change. |
No constitutional exceptions or unresolved clarification.

## Design
1. Shared AuthEntryShell.jsx and AuthEntry.css under .auth-page.auth-entry. A desktop shell up to1120px with a restrained blue learning/brand panel on the left and a centered form up to410px on the right. Shared identity matches the LMS shell; a local decorative book SVG is hidden from assistive technology and conveys no account data or metrics. Form heading28px, fields/body14px; fields and primary/role actions minimum44px; visibility/text controls36px. Registration uses tighter vertical spacing so its extra field, role controls and legal copy fit1280×800. Keep title → fields → primary action → recovery; no added product capability, navigation control or dependency.
2. Preserve name/email within AuthPage modes, clear passwords/visibility/errors/results on changes. Pending disables conflicting controls. Registration remains page-local; existing ?mode=forgot remains URL-backed. Preserve location.state.from and synchronize history. Focus task heading on mode changes, first invalid field on validation.
3. noValidate with production-equivalent validators and associated errors/autocomplete. Trimmed name2–80; normalized email regex without invented254 limit; exact password6–72, never trimmed. Public Student/Instructor only.
4. Capture operation location/mode/session generation; synchronous ref gates duplicates. Check current mounted/context/generation before effects or credential installation. Adopt own acceptCredentials generation increment, then reject replacement. Clear secrets at scope transitions.
5. Confirmed entry followed by /me error shows separate read-only recovery, GET-only retry or explicit sign-out. Never resend entry automatically. Navigate through safe return helper only after verified identity; actual expiry authoritative.
6. Forgot200 is generic, not delivery/existence proof. Only forgot503 uses email-service copy;429 says retry later without countdown. Registration/reset uncertainty describes possible server processing, offers explicit recovery, never auto-replays.
7. Reset form keyed by link/session context, never exposed in DOM. Missing/malformed disables writes. Only precise invalid-link400 disables a valid-looking link; validation/unknown400 stays recoverable. Pending disables fields/visibility; success clears secrets and offers sign-in. Old context has no effects.
8. Harden existing safe-return helper for router-equivalent trailing-slash auth/reset paths; preserve role fallback and internal query/hash.

## Project Structure
Frontend implementation files: frontend/src/pages/{AuthPage.jsx,ResetPasswordPage.jsx,AuthEntry.css}, frontend/src/components/AuthEntryShell.jsx, frontend/src/services/{authEntry.js,navigation.js}, frontend/src/__tests__/frontend.test.js. README.md corrects role wording. Design/artifacts stay under this feature; ignored automation/evidence under .artifacts/auth-entry-20261102/.
SessionContext/API client, production backend, schema, dependencies and001–007 artifacts remain unchanged.

## Risks and verification
- Own install versus external generation: test both sides of credential acceptance, delayed responses and history departure.
- Confirmed creation versus failed verification: GET-only retry, no duplicate mutation.
- Reset400 ambiguity: exact existing message classification, backend unchanged.
- Secret URL: no query values, headers, payloads, storage or secrets in evidence/screenshots.
- SMTP Gmail-only; no safe config/recipient. Actual503/429 and DB-prepared reset testable; actual delivery NOT RUN.
- Full frontend test/lint/build, backend full/quiz regression; real8form×viewport, three-role entry/reset/revocation,001–007 regression; [quickstart](quickstart.md).

## Phase outputs
Research/design complete; tasks generated separately. Requirements review and read-only analyze gate implementation.

## Implementation verification detail

Confirmed entry followed by explicit401 retains the confirmation read-only, disables identity retry without a usable session, and requires explicit sign-out before fresh entry. This preserves server expiry and avoids replay. Confirmed reset offers explicit sign-in that clears local identity before reauthentication. Final proof and external SMTP limitation: [verification.md](verification.md).

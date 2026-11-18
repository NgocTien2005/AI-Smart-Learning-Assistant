# Feature Specification: Free hosted storage and recovery

Created: 2026-11-18. Status: clarified. Official allocation025, baseline d8716a8 clean, branch feat/free-hosting-adapters temporarily stacked on security/runtime-advisories. Input: private durable uploads and HTTPS recovery email for free hosting; provide deployment guide.

## User Scenarios & Testing

### US1 - Durable private documents (Priority P1)
Instructor uploads/replaces/removes supported documents; enrolled students download exact bytes after backend restart. Other instructors, unauthenticated callers and unenrolled/former students remain denied before storage access. Invalid/oversize inputs never succeed. Replacement conflicts preserve the winner. Old local references retain their identity. Remote outage never silently saves to ephemeral disk.

### US2 - Password recovery over available transport (Priority P1)
User requests recovery from the hosted app. Valid configured HTTPS delivery sends one message linking the frontend origin. Generic response, one-use reset and old-session revocation remain. Missing config is unavailable; rejection/quota/timeout leaks no email existence or credentials. Ambiguous send is never replayed. SMTP remains selectable locally.

### US3 - Reproducible free-tier deployment (Priority P2)
Operator creates a new database/private storage and deploys exact code using platform HTTPS subdomains, no paid billing. Guide states every private setting, migration/admin procedure, limits and staging checks. Local transport tests are never called real provider/mailbox acceptance.

### Edge Cases
Missing/invalid config, public bucket, unsafe or foreign reference, missing object, 429/5xx/redirect/oversize/timeout, uncertain database commit, cleanup failure, local legacy files absent on new host, sender verification/quota, backend cold start, pooler/TLS.

## Requirements

- FR001: preserve current protected upload/download/reprocess/remove and course deletion APIs, roles/owner/enrollment, validation10MiB, extraction/revision and quiz snapshots.
- FR002: explicitly select remote private storage for new uploads and persist provider-aware opaque references, never public/signed URLs. Preserve old local references; no automatic migration/reset/delete of prior data.
- FR003: reject invalid config/public bucket/remote failures, bound transfer size/time, suppress upstream output, no local fallback. Delete only exact app-owned objects through authorized actions or known failed writes; retain a possible orphan rather than delete a potentially committed document after ambiguous DB failure.
- FR004: explicitly selected HTTPS reset sender alongside existing local SMTP. Preserve forgot generic response, validation, single-use reset and authVersion revocation. No retry/fallback/new real sends or reuse of previous send budget.
- FR005: free-tier deployment guide covers server secrets, storage privacy, fresh DB migrations/admin, origins, existing-data caveats, quotas/sleep, backup and real-provider acceptance gates.
- FR006: transport contracts and production-router authorization tests, backend/quiz and isolated HTTP/database integration when available; command/cwd/exit and sanitized evidence.

### Non-functional and security requirements
No new dependency, paid billing, automatic deployment, schema/migration or auth/UI redesign. Bound upload/read10MiB and provider duration. No secret in client, URL/query or logs. Operator-configured storage receives documents; selected sender receives recipient/reset link; neither expands AI sharing. Private bucket with no public policies plus backend auth required; server key bypasses RLS. Cleanup failure records safe code and retained-orphan limitation, never false success.

### Key Entities
Existing Lesson.documentUrl: local basename or tagged remote object identity; documentName remains display name. Existing User reset hash/expiry/request time/authVersion unchanged. External delivery ID never treated as mailbox proof.

## Success Criteria
- SC001: authorized round-trip exact bytes; denied actors trigger zero storage operations in production-router tests.
- SC002: existing recovery and new sender tests pass without real send; real-mailbox status remains open without operator acceptance.
- SC003: guide has every required setting and no broken local links; unrun provider/hosted acceptance remains explicitly open.

## Clarifications and assumptions
2026-11-18 coverage scan: goals, actors, compatibility, data identity, privacy, failure behavior, acceptance and scope clear from request; no new product/API/schema decision. Technical provider choices belong to plan. Local remains default; hosted uses new empty DB, not copied private/demo data. Private setup and fresh mail permission are prerequisites for actual provider acceptance. No guarantee of perpetual free availability or sending without approved sender.

## Scope
Goals: durable private uploads, configurable recovery over HTTPS and deploy instructions. Non-goals: auto-migrate historical files, public/direct client access, new AI, billing/domain purchase or actual external deployment.

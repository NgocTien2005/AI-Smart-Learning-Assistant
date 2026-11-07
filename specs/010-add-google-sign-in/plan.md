# Implementation Plan: Existing-account Google sign-in

**Feature**: 010-add-google-sign-in | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)
**Git**: main, no branch switch required. Official setup-plan script resolved these paths.

## Summary

Add optional Google Identity Services (GIS) popup sign-in for explicitly linked existing accounts only. No provisioning or automatic email merge. Preserve the existing auth shell, password mutations, /me verification and role routing.

## Technical Context

**Language/Version**: ES modules; Node 24+ (host 25.2.0), React 19/Vite 8, Express 5/Prisma 7.
**Primary Dependencies**: Existing jsonwebtoken, node:crypto and fetch; Google's hosted GIS script. No npm dependency or lockfile upgrades; frontend npm test discovery includes the new regression file.
**Storage**: PostgreSQL 17; nullable unique User.googleSubject; bounded in-memory challenges.
**Testing**: Node tests including production router injection; Vitest components; isolated Compose HTTP/database; real browser desktop; optional user-operated Google acceptance.
**Target Platform**: Browser, single Linux Docker backend and PostgreSQL.
**Project Type**: Two-package web app.
**Performance Goals**: Five-minute challenges; 5-second bounded key fetch; Google failure must leave password UI usable.
**Constraints**: No credentials/profile/raw requests in evidence; no local8081 DB operations; no automatic mutations/retries.
**Scale/Scope**: One backend instance, one Google identity/account; no unlink/provider token storage.

## Constitution Check

Pre-design and post-design: PASS I–V. Additive contracts traced below; server checks current owner/active/authVersion; tests include denials. New nullable column preserves old rows/passwords/roles and all existing cascades. No dependency upgrades. Real provider prerequisite remains explicit. No constitution or managed skill changes. No hooks configured.

## Project Structure

- frontend/src/pages/AuthPage.jsx → components/GoogleIdentityButton.jsx → services/googleIdentity.js + services/api.js → app/SessionContext.jsx → /api/auth/me.
- frontend/src/pages/AccountPage.jsx → components/account/GoogleLinkPanel.jsx → shared GIS component.
- backend/server.js → src/app.js → routes/googleAuth.js → services/googleIdentity.js → injected Prisma and utils/auth.js. Legacy backend/app.js untouched.
- backend/prisma/schema.prisma + new immutable migration; test/googleAuth.test.js and test/googleIdentity.test.js.
- docs/google-sign-in.md; compose.yaml and frontend/Dockerfile pass the public client ID only.
- This directory: spec, research, data-model, contracts/auth.md, quickstart, checklists, tasks, verification and traceability.

**Structure Decision**: Small new Google-specific modules, existing auth/session components retained.

## Design and implementation sequence

1. Optional GOOGLE_CLIENT_ID (backend), VITE_GOOGLE_CLIENT_ID (frontend build). Same ID/origin configuration; no client secret. Absent config gives honest disabled UI/503 without touching DB.
2. Create browser-bound challenges with random nonce/id/binding cookie (HttpOnly, SameSite=Lax, path /api/auth/google, Secure for HTTPS configured APP_ORIGIN), max 5 minutes, max 1000 entries, 20 challenges/IP/5 minutes. Cookie belongs to one attempt; intent login/link plus link owner/authVersion. Compare binding in constant time; consume before external verification, including failures.
3. Verify RS256 only with Google's fixed HTTPS JWKS; cache per Cache-Control with upper bound, unknown-key refresh cooldown, timeout, body/key bounds. Verify exact audience, allowed issuer, required exp/iat/sub/email_verified/nonce. No tokeninfo endpoint or token logging.
4. Link protected by real authenticate; reread active owner/authVersion/email and perform conditional updateMany (null/same subject), unique index resolves cross-account races. Reject mismatches/conflicts; never overwrite. Only linked boolean public.
5. Login finds unique stable sub, not email. Recheck current active account/authVersion after verification before issuing existing Lumina token; no user.create path. No linked account → 403 guidance without email lookup.
6. GIS official rendered popup button only; no One Tap or auto-select. Prepare on explicit action, not on page visit. SDK loaded once, cancellation/stale owner guards, one scoped callback and server nonce prevent old popup acceptance. Google credential stays transient. Shared parent pending gate serializes password/Google mutations; after success use acceptCredentials and existing continuation. A cancelled popup can be explicitly cancelled/restarted without locking password forever.
7. Account link panel uses its own read-only status endpoint; other account operations are locked while link is pending. Uncertain result requires explicit status check, not replay.
8. Additive nullable unique column generated as migration diff against existing schema; do not normalize unrelated historical index drift or run migrate reset. Apply/status on a newly provisioned isolated acceptance stack; rebuild images, verify HTTP + actual DB identity and integration cleanup.
9. Full frontend suite/lint/build, backend suite/quiz, Prisma validate/generate/status; actual browser at both required sizes. Real Google acceptance pending client setup; user alone operates personal Google UI. Hosted CI reported only from actual run.

## Complexity Tracking

No constitution exceptions. In-memory challenge storage intentionally rejects unfinished attempts after restart; multi-instance deployment is outside this feature and documented as a readiness condition.

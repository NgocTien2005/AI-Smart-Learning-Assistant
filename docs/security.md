# Authentication and security design

Lumina uses one-day signed Bearer JWTs. Every protected request reloads the user,
checks `isActive` and compares `authVersion`; the database role is authoritative.
Password change/reset increments that version. Reset tokens are random, stored
hashed, expire after30 minutes and are consumed by a conditional update. Opening
a used-link form is not acceptance; a repeated submit must fail.

## Trust boundaries and compatibility

React pages → SessionContext/API client → production `backend/src/app.js` →
auth/current-user middleware → Prisma/PostgreSQL. Tests now import the production
auth router and current-user factory. `backend/app.js` is historical legacy and
does not provide runtime authentication evidence.

Public registration remains STUDENT/INSTRUCTOR only. Email is trimmed/lowercased;
passwords retain surrounding spaces and the existing6–72-character validation.
Public user responses contain id/name/email/role only. Forgot responses remain
generic for valid email requests below budgets; configuration-unavailable503
does not depend on account existence. No automatic retry of password mutations.

Google is optional: existing active, explicitly linked accounts only; no
auto-registration/email merge. Challenge cookie/nonce/signature/audience/expiry
validation remains unchanged. Real provider acceptance is feature010T016.
Historical real-mail acceptance stays008T023; current SMTP readiness is not proof
of delivery. No real email/provider call is part of security regression tests.

## Abuse controls

| Operation | Fixed-window budgets |
| --- | --- |
| Login |100/IP/15min plus10/IP+normalized-email/15min |
| Register |40/IP/hour |
| Forgot |20/IP/15min plus5/IP+normalized-email/15min |
| Reset submit |30/IP/15min |
| Change password |20/current-user/15min |
| Course join |20/current-user/15min |

All attempts reaching the route guard count, including invalid credentials;
denial occurs before bcrypt/database/email work. Response429 uses `RATE_LIMITED`
and an integer `Retry-After`. UI preserves existing error handling; wait and retry
explicitly. Each limiter caps10000 active hashed keys; full capacity denies new
keys instead of evicting an active budget. Expired entries are reclaimed. No raw
email/token/password in bucket identifiers or evidence.

These are **single-process** controls, reset on restart. They do not stop a
distributed attack or replace edge protection, monitoring and a shared store.
Express `trust proxy` remains false: Nginx clients share an IP budget. Client
`X-Forwarded-For` cannot bypass it. Before public/multi-instance deployment choose
trusted proxy networks, overwritten forwarding headers and shared limits; do not
set blanket trust or guess a hop count. Shared IP users can receive429 together.

## XSS, CSRF and session storage decision

Existing remember-me uses localStorage, otherwise sessionStorage. Both are
JavaScript-readable and vulnerable to token theft through XSS. React renders
untrusted text as text; source/citation validation and file authorization remain
server-side. CORS and escaping are layers, not proof that XSS is impossible.

Bearer headers are attached explicitly by the client rather than automatically
as ambient cookies; a cookie-CSRF middleware is not blindly added to this design.
The Google challenge binding cookie is HttpOnly/SameSite=Lax (Secure for HTTPS)
and challenge consumption/nonce remains required.

A future session migration should jointly change frontend/backend, define
HttpOnly/Secure/SameSite cookies, CSRF/origin protections for mutations,
logout/revocation, remembered-session lifetime, compatibility/rollout and proxy
TLS behavior. HttpOnly reduces token extraction but XSS can still issue actions.
This feature does not silently migrate current sessions or reset user credentials.

## Request/response and resource protection

Non-object parsed JSON is rejected; absent bodies are normalized for bodyless
commands and fail existing field validation on required-body endpoints. Auth
router enforces object input. JSON is bounded1MiB, upload middleware10MiB. Multipart
is parsed by Multer and keeps extension/MIME/content validation. No client role,
hidden UI control or ADMIN designation bypasses course ownership/enrollment.
Quiz attempts retain owner/current access, snapshots and version concurrency.

API responses disable framework banner and set nosniff/no-referrer/no-store,
including errors. Static HTML headers/CSP/TLS need their own Nginx/deployment
review; API headers do not secure an HTML document. No broad CSP/COOP/HSTS is
enabled without Google/popup/blob-preview and HTTPS validation. Internal auth
and uncaught errors log only constant event names and known safe error codes;
never arbitrary error objects, SQL parameters, tokens or reset URLs.

## Verification and residual risk

See [feature014 verification](../specs/014-auth-abuse-hardening/verification.md)
for actual commands, production-handler coverage, isolated database integration
and hosted SHA. No penetration-test, distributed-load or production readiness
claim. Existing Google/Gemini acceptance, TLS, backup/restore, CSP and operational
monitoring gates remain explicit in [production readiness](production-readiness.md).

Primary references: [Express production security](https://expressjs.com/en/advanced/best-practice-security/),
[Express proxy trust](https://expressjs.com/en/guide/behind-proxies/),
[OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
[OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
[OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

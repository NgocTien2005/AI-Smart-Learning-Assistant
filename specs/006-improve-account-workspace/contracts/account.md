# Existing account contract —006

Read-only production inventory. No new endpoint/data field or server permission.

## Trace

frontend/src/app/App.jsx AccountRoute/GuardedRoute → pages/AccountPage.jsx and components/AppLayout.jsx → app/SessionContext.jsx → services/api.js/apiErrors.js → backend/server.js → backend/src/app.js /api/auth → routes/auth.js + middleware/authenticate.js → Prisma User → utils/auth.js publicUser.

backend/app.js is a legacy auth test harness, not production. GuardedRoute is local to app/App.jsx; no components/GuardedRoute.jsx exists.

| Operation | Request/success | Failure/validation |
| --- | --- | --- |
| GET /api/auth/me |200 {user:{id,name,email,role}} |401 AUTH_REQUIRED/SESSION_INVALID from authenticate; network/5xx recoverable |
| PATCH /api/auth/me |{name:string}; trim;200 public user | name2–80 trimmed JS characters else400; updates authenticated user's ID only;500 operation error |
| POST /api/auth/change-password |{currentPassword,newPassword};200 message asking reauthentication | both untrimmed JS string length6–72; different passwords;400 CURRENT_PASSWORD_INVALID when comparison fails;500 operation error |

Confirmation is frontend-only and never sent. No email/role editing contract. All authenticated roles may operate on their own account; these endpoints need no course ownership predicate or ADMIN bypass.

Authentication verifies JWT plus current active user and authVersion. Successful password mutation hashes password, increments authVersion, clears password-reset token metadata and issues no replacement token. UI clears the local session and returns to existing sign-in passwordChanged notice. No user/hash/password returned beyond public fields.

## Client/session risks from source

SessionContext refresh uses GET /me and guarded request sequence; login/logout/expiry invalidate its callbacks. AccountPage currently calls updateStoredUser after awaiting refresh even if its original lifetime ended; this redundant cache write must be removed or scoped. Read verification currently unmounts account via GuardedRoute; user selected retained read-only account recovery during revalidation.

API error handling currently expires the whole session for any matching401, even one started by a previous login. A frontend session generation and request-token scope can prevent stale responses clearing a newer session without changing auth semantics. fetchDocument uses the same error path and requires corresponding regression coverage if modified.

No automatic PATCH/POST replay after uncertainty. Read recovery cannot guarantee that an absent saved change was never committed. Password values stay in necessary mounted-form/request memory, never persisted or logged.

## Live verification prerequisites

Existing identified test account IDs/roles and permitted profile edits; normal authorized sessions; current healthy API/database target. Missing/invalid session, own account, other-user payload cannot change target identity, role/email ignored by supported name-only UI, public response secrecy, password revocation and reauthentication require appropriate production evidence. User performs live password entry/change. No provisioning/reset/delete/cleanup to create evidence.

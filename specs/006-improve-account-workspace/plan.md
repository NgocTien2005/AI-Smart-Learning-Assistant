# Implementation Plan: Account Workspace

**Branch**:`006-improve-account-workspace` (artifact ID) | **Date**:2026-11-01 | **Spec**:[spec.md](spec.md)

## Summary

Clear account identity/profile editing and intentionally separate password management. Implement user-selected read-only account recovery without unmounting name draft/outcome, plus credential-scoped async effects. Keep all server contracts and other guards intact.

## Technical Context

**Language/Version**: JavaScript/React19; Node25 local, Vite8.
**Primary Dependencies**: existing React/router, Button/Feedback; none added.
**Storage**: current session storage semantics retained; in-memory generation/drafts only, passwords never persisted.
**Testing**: existing Node service tests + Vitest/jsdom/RTL real component tests; ESLint/Vite build; current desktop/HTTP acceptance separately.
**Target Platform**: desktop1280×800/1440×900 zoom100%,3roles.
**Project Type**: separate frontend/backend web packages.
**Performance Goals**: single pending account write/read recovery, no new request polling or SLA.
**Constraints**: frontend only; preserve API/backend/schema/migrations/permissions, no secret retrieval or unapproved live writes.
**Scale/Scope**:7 frontend source/test files below, feature artifacts; no unresolved clarification.

## Constitution Check

| Principle | Pre-research | Post-design |
| --- | --- | --- |
|I Contract consistency |PASS existing production trace |PASS name-only PATCH, untrimmed passwords, public mapping unchanged |
|II Server authorization |PASS own-account predicate |PASS retained view cannot write until verified; current401 still expires, no role grants |
|III Recoverable UX |PASS user choice A |PASS distinct saved/verify errors, newer drafts, password boundaries, keyboard/CSS |
|IV Evidence quality |PASS baseline captured |PASS V01–V08 fixtures/live separate, missing runtime tasks remain open |
|V Controlled scope/data |PASS198-file baseline |PASS no data/dependency/backend/old-feature writes |

These gates assess design, not runtime pass. No exceptions.

## Project Structure

Artifacts: spec/plan/research/data-model/quickstart/contracts/account.md/checklists/tasks/verification.

Application files:
- frontend/src/app/App.jsx — account-only retention option; all other routes/startup unchanged.
- frontend/src/app/SessionContext.jsx — credential-install boundary, clear old user, generation exposure and guarded refresh.
- frontend/src/services/api.js — generation helpers and current-scope expiration for API/document requests.
- frontend/src/pages/AccountPage.jsx — keyed account workspace, profile/edit/outcome/recovery and shared operation lock.
- frontend/src/pages/AccountPage.css — new scoped desktop presentation.
- frontend/src/components/account/PasswordManager.jsx — new disclosure and ephemeral form.
- frontend/src/__tests__/frontend.test.js — requested meaningful regressions, preserving existing assertions.

Read-only: AppLayout/AuthPage/Feedback/Button, production auth/middleware/User schema, packages/Compose/integration script.

## Design decisions

- **D01 Hierarchy**: workspace-consistent header, read-only identity sidebar and primary profile card, password section below with collapsed form. Inter body16px, existing blue/navy/neutral tokens,12–24px spacing, compact labeled fields, long-content wrapping. No global CSS/mobile behavior. FR002/017/018, US1-AC1/US4-AC1/2.
- **D02 Read-only recovery**: AccountRoute-only retain option when known current-session user exists and statusloading/error; same element tree remains mounted. Name read-only, all mutation/disclosure actions gated, password component unmounted while unverified. Distinct saved notice plus verification pending/error, GET retry and logout. Startup usernull/other guarded routes unchanged. FR007/010/016, US2-AC1/4.
- **D03 Session identity**: module generation advances on every credential install/clear; apiRequest/fetchDocument snapshot generation+token before request, expire only current scope. SessionProvider checks sequence+generation before cache/state effects, clears old user on new credentials, exposes stable generation. Account workspace key user.id:generation; no increment on ordinary refresh. FR009/010/014, EC04.
- **D04 Profile operations**: immediate ref lock serializes profile/password/read recovery; name remains editable during PATCH, edit counter protects newer draft including edit-away/back; saved value recorded separately. Remove AccountPage updateStoredUser. GET /me drives header/current identity. Network/5xx/malformed write result treated uncertain with retained draft/read recovery, never automatic replay. FR003–008.
- **D05 Password component**: local field/error state, exact untrimmed6–72 lengths, distinct new/current and confirmation; focus first invalid field; CURRENT_PASSWORD_INVALID targets current field, operation/network errors separate. Opening focuses current field, closing clears and returns trigger focus; pending disables fields/toggle/other mutations. Confirmed success clears via unmount/logout then existing passwordChanged sign-in notice. A transient context logout reason carries that same notice through a competing guarded-route redirect, cleared on ordinary logout, expiry or credential install; no durable state or AuthPage redesign. Uncertainty offers session check/sign-in without replay. FR011–016.
- **D06 Async/lifetime safety**: mounted/generation/account scope checks before state, cache calls or navigation; redundant cache writes removed. Password section key changes when verified state changes and when identity verification starts, including reads too fast to commit a loading render; no secrets in parent persistent state/storage/URL/logs. Profile draft ends on account route/identity lifetime, not refresh. FR005/006/009/016.
- **D07 Accessibility/states**: shared feedback/button, visible labels, described separate FieldError, alert for failures/status for pending/success, native password autocomplete, focus restoration. Read-only known view explicitly says last verified identity; failed verification never shown as saved authentication. FR002/007/013/017.
- **D08 Verification**: baseline121+5pass; tests first for real account/parent/session/request races, then full npm test/lint/build. Six desktop role×viewport runs and current auth/HTTP/revocation checks required; user performs live password entry. No safe resources/runtime currently; keep tasks open. FR019, SC001–007.

## Risks and mitigations

- Retained account leaks old identity after replacement: clear prior user synchronously at credential install; generation-key remount; stale read/error scopes tested.
- Token equality insufficient: numeric credential generation plus token; same-token relogin fixture.
- Profile200 then /me503: preserved saved confirmation and newer draft, writes gated, read retry only.
- Unknown write outcome: no false unchanged-password claim; no auto replay; explicit read/sign-in recovery.
- Sensitive drafts: child unmount on close/unverified/identity; no snapshots of live values or storage.
- Shared client impact: regress current/stale401 for API/document and existing auth/LMS suite; server unchanged.
- Native layout/keyboard cannot be certified by jsdom; retain live acceptance gates.

## Complexity Tracking

No constitutional violation. Narrow frontend request scoping and account-route opt-in are required by clarified behavior; no global auth redesign.

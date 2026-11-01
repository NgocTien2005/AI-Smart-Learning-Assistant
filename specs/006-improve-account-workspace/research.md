# Account006 inspection / research

2026-11-01. Inspection and managed plan research complete; user-selected recovery presentation is incorporated below.

## Baseline and tools

Clean tree e4ccbf2913ed5f3fee16b6eb98bb42bd4eb92a53,198 tracked files; baseline hashes/source copies in .artifacts/account-workspace-20261101/. Official resolver initially005, script allocated006-improve-account-workspace. CLI/integration1.2.3 Codex/PowerShell/sequential. extensions.yml absent; no applicable hooks. Constitution1.0.0 retained.

Baseline frontend npm test passed5 service and121 component tests. Earlier intermittent quiz-history failure remains a separate prior observation, not reproduced or fixed by this baseline run.

## Prior feature state — separate acceptance work

| Feature | Open task markers |
| --- | --- |
|001 |T021/T022/T024/T025 |
|002 |T018/T019/T021/T022 |
|003 |T021/T022/T024/T025 |
|004 |T021/T022/T024/T025 |
|005 |T021/T022/T024/T025/T027/T028 |

Read their spec/tasks/verification. They concern prior desktop/HTTP acceptance and append-only continuations. No task closed, modified or transferred. The complete original task text is saved in baseline.json.

## Current evidence

No live account observation. Health probes8080/8081/3000 unavailable; Docker Linux engine pipe absent. Browser inventory reports0 providers and unavailable access host; no relevant Lumina window. No fresh screenshots/bounds or identified safe account/profile-write permissions. No live password entry/writes, seeding, reset, provisioning or integration.

## Repository findings and conflicts

- Contract trace/validation: [contracts/account.md](contracts/account.md). Name trim2–80, untrimmed passwords6–72/different/exact confirmation; server403/course predicates are separate from own-account auth. PublicUser excludes hashes/passwords.
- AccountPage unconditionally replaces name on PATCH completion; newer editable drafts can be lost. State-only duplicate gates can race. It awaits refresh then writes cached identity even if logout/unmount made refresh return null.
- SessionContext refresh replaces authenticated view with loading/error. Retaining a newer account draft and saved outcome needs an explicit presentation choice, while protecting writes and keeping startup/other-route guards unchanged.
- api.js invalid-session handling lacks originating-session scope. An old401 can clear a later login. Current server authority must remain intact.
- README.md extraction/summary section versus its backlog line126 conflict: services/documentProcessing.js and routes/courses.js implement local extraction/summary; OCR absent. Preserve unrelated README.
- frontend/README.md prototype src/data description differs from current API-backed pages. No prototype data is added.
- docs/development-workflow.md pre-init section is explicitly dated2026-10-28; current .specify metadata/skills prove initialized1.2.3. Do not reinit based on that snapshot.
- Existing integration script provisions accounts/resources and uses Docker SQL cleanup; not run without healthy verified targets and authorization.

## Clarification record

Question sent: retain known account view read-only during post-save verification failure, or full-page recovery while preserving only name draft/saved outcome in memory? This changes acceptance presentation and shared guard/state design. User answered option A before dependent planning. The selected view remains read-only until verified; missing/expired-session behavior is preserved.


## Resolved clarification and Phase0 decisions

User explicitly selected A: retain the known account view read-only, preserving draft/outcome and blocking writes until verification succeeds. No unresolved product/technical clarification remains. Managed plan Phase0 dispatched one read-only research agent, whose source findings and tests were consolidated below. No code or state changed by the agent.

### R01 — Account-only retained view
Decision: GuardedRoute opt-in only for AccountRoute; keep the exact AppLayout/AccountPage tree during loading/error when a current-session previously verified user exists. AccountPage gates writes and shows verification feedback; startup/other routes unchanged.
Rationale: preserves newer draft and saved notice without treating failed verification as authentication success.
Alternative: global background refresh would weaken other route recovery semantics; provider draft storage is unnecessary for the chosen retained view.

### R02 — Credential generation and request scope
Decision: api.js module generation increments on clearSession and every credential installation, even identical token text; request snapshots capture generation+token. SessionProvider exposes generation and checks scope plus its existing request sequence. Credential replacement clears old user before refresh. AccountPage keys by user ID/generation.
Rationale: same-token relogin can occur; old401 or success must not clear/revive a newer session.
Alternative: token comparison alone or keying only by user.id misses same-session-text lifecycle boundaries; refresh sequence is too volatile for draft keys.

### R03 — Profile state and recovery
Decision: one immediate account operation lock; edit-generation guard for normalized draft updates; confirmed saved name separate from verified current identity; remove redundant updateStoredUser after refresh. Verification retry GET-only, uncertainty never automatically replays writes.
Rationale: keeps newer text and explains two distinct outcomes.
Alternative: freezing name input during PATCH avoids races but fails the explicit editable-draft journey.

### R04 — Password lifetime
Decision: separate PasswordManager/form component; secrets only inside mounted form, cleared on collapse/account/credential/verification boundaries. Pending disables form/disclosure/other writes. Existing autocomplete/rules/errors; confirmed current-scope success logs out with existing sign-in notice.
Rationale: sensitive values have a short explicit lifetime; delayed success cannot affect replacement login.
Alternative: durable drafts or preserving password fields during unverified recovery is outside scope and unsafe.

### R05 — Small UI/verification scope
Decision: existing Button/Feedback, native password inputs, scoped AccountPage.css, desktop only. Controlled fixtures prove races; current live checks remain gated.
Rationale: no new dependency/API/backend/schema/session authority. No known baseline failure in the current121-test run; historical quiz flake retained separately.

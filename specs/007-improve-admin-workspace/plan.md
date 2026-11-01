# Implementation Plan: ADMIN Account Workspace
**Branch**:`007-improve-admin-workspace` (artifact ID) | **Date**:2026-11-01 | **Spec**:[spec.md](spec.md)

## Summary
Prioritize compact public account rows, supported search/page and one deliberately selected editor. Preserve per-account drafts/locks, independent writes, confirmation, authoritative reload and session006 behavior. Add generation-scoped local effects and current403 blocking without modifying shared session/API code.

## Technical Context
**Language/Version**: JavaScript, React19, Vite8; current Node25.
**Primary Dependencies**: existing React/router, Button/Feedback/ConfirmDialog; none added.
**Storage**: in-memory drafts/outcomes/selection only; existing token/identity handled by SessionContext unchanged.
**Testing**: Node service tests plus Vitest/jsdom/RTL; full npm test/lint/build; real desktop and authorized HTTP separately.
**Target Platform**: desktop1280×800/1440×900 at100% zoom.
**Project Type**: separate frontend/backend npm packages.
**Performance Goals**: preserve250ms search debounce, bounded25-account server page and zero obsolete-result commits; no new polling/SLA.
**Constraints**: preserve211-file baseline including uncommitted006; frontend only; no API/schema/dependency/permission change.
**Scale/Scope**:3 source/test files below and007 artifacts. No unresolved clarification.

## Constitution Check
| Principle | Before research | After design |
| --- | --- | --- |
|I Consistent contract |PASS production admin trace |PASS q/page only, name/role/isActive and existing errors |
|II Server authorization |PASS middleware/schema read |PASS no new capability;403 stops actions,401 remains shared mechanism |
|III Recoverable learning UX |PASS explicit list/editor/draft states |PASS target-specific outcomes, read retry, keyboard/native dialog |
|IV Evidence |PASS baseline5+160 |PASS fixtures/live distinct, open acceptance tasks retained |
|V Scope/data integrity |PASS dirty006 captured |PASS onlyAdminPage/CSS/related admin tests; no data provisioning |

## Project Structure
Artifacts: spec/plan/research/data-model/contracts/admin.md/quickstart/checklists/tasks/verification.
- frontend/src/pages/AdminPage.jsx: session-aware keyed wrapper and workspace; list, optional editor, draft/outcome maps, immediate locks, read generation/sequence and permission recovery.
- frontend/src/pages/AdminWorkspace.css: new narrowly scoped desktop styles imported last.
- frontend/src/__tests__/frontend.test.js: adapt only existing ADMIN cases for deliberate selection/session fixture; preserve their behavioral assertions and every unrelated006/LMS test, append meaningful new cases.
Read-only: App/AppLayout/SessionContext/api.js/ConfirmDialog/Feedback/Button, production backend/schema/Compose/packages, all001–006 artifacts.

## Design decisions
- **D01 List first**: current page width1180, 16px Inter body, existing navy/blue/neutral palette,16–24px gaps; search and public result rows precede one selected editor in desktop list/detail grid. List remains usable without editing. No role/status filters or automatic selection.
- **D02 Selection/draft**: selectedId initiallynull; explicit row button opens/focuses editor heading, closing restores connected trigger focus. Per-ID dirty drafts survive close/switch/search/page and failures until route/session boundary. Fresh results omitting target close editor without stealing search focus. No new URL query contract.
- **D03 Read reconciliation**: preserve sequence+AbortController/current query/page ref; normalize query trim120 and250ms debounce. Invalidate at view changes and both mutation boundaries. Clamp empty last page and fetch actual remaining page. Previous results labeled during pending/error; known rows may still be acted on deliberately, preserving existing behavior; server decides current permission/data validity.
- **D04 Independent writes**: immediate per-ID ref lock plus pending map, never global account lock. Disable that account's fields/save/toggle, allow another selection/write. Functional/ref draft updates prevent same-tick field merges losing edits. Status toggle sends onlyisActive and retains profile draft.
- **D05 Outcomes/recovery**: per-ID target-labeled outcome map outside editor; one account's response cannot overwrite another's outcome/draft/selection. Confirmed PATCH merges returned public fields into matching rows, preserves counts/date, clears only that save's dirty draft and shows actual target. Reload failure separate; retry GET only.400 name validation associated when production name error matches;409 linked-record guidance;404/generic400 operation; network/5xx/malformed success uncertain, no replay.
- **D06 Session/permission**: use existing context verified ADMIN; key workspace by user.id:generation and check mounted/generation before all effects. Current403 sets local denial, invalidates pending reads/closes confirmation, blocks writes; explicit identity verification uses existing refresh/guard semantics.401 stays shared API expiry. No retained-admin guard or shared session modification; preserve006.
- **D07 Confirmation/a11y**: reuse native ConfirmDialog for role/status, snapshot target+payload and recheck current scope/permission/lock on confirm. Name-only save direct. Label controls, errors outside labels, focus editor on selection and trigger on deliberate close, no async focus theft; status/alert feedback and visible focus/long wrapping.
- **D08 Verification**: tests first; retain existing race/conflict/clamp/independent-write assertions while adapting interaction to selection. Full baseline5+160PASS. Current8081 health200 and Compose backend/db healthy, anonymous401 checks pass; no authenticated session/designated safe write resources yet, CUA host unavailable. Orca embedded browser discovery separate; current deployed asset observation is not automatically current feature proof.

## Risks and alternatives
Repeated inline forms obscure list→single editor; neither persistent drafts nor global locks needed. Token comparison alone misses same-token relogin→reuse006 credential generation. Global shared-session redesign unnecessary→local keyed wrapper. No optimistic invented list membership/count: authoritative reload and explicit stale labeling. Existing name-only PATCH may include unchanged role, preserving contract; no last-admin/email editing.
CSS must override stronger role-dashboard-shell rules only beneath admin-workspace. Native dialog/jsdom is fixture evidence only. Live role/status changes require user action and designated existing resources; no seed/integration cleanup without authorization.

## Complexity Tracking
No constitution exception. Reuse existing state/controls and isolate changes to administration.

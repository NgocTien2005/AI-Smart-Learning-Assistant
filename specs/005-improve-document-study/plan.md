# Implementation Plan: Local Document Study Workspace

**Branch**: `005-improve-document-study` (artifact ID) | **Date**:2026-11-01 | **Spec**:[spec.md](spec.md)
**Input**: User-authorized frontend feature; constitution1.0.0 retained.

## Summary

Prioritize readable private lookup history with a compact lower composer, reliable draft/reload/send recovery and stable reading position. Show extractive summaries with honest source metadata and distinct empty/unavailable/error states. Reuse current React/CSS/API and isolate requests by panel context.

## Technical Context

**Language/Version**: JavaScript/JSX, React19; local Node25.2.0.
**Primary Dependencies**: existing react-dom/react-router-dom, Vite8.2.2; no additions.
**Storage**: in-memory panel state; unchanged PostgreSQL/Prisma backend.
**Testing**: Node service tests plus Vitest4/jsdom29/RTL component suite; ESLint and Vite build; real browser/HTTP acceptance when prerequisites exist.
**Target Platform**: desktop1280×800/1440×900 at100% zoom.
**Project Type**: separate frontend/backend web packages.
**Performance Goals**: bounded50-message visible history, single pending send/read/retry; no new latency SLA.
**Constraints**: existing contracts/session/authorization, local extraction/lookup, immutable backend/schema/migrations/dependencies; no writes without safe resource identification.
**Scale/Scope**: two study panels and scoped CSS/component regressions. No unresolved technical/product clarification.

## Constitution Check

| Principle | Before research | After design |
| --- | --- | --- |
| I Contract consistency | PASS: production trace required | PASS: contracts/study-tools.md records existing requests/errors/provenance |
| II Server resource authorization | PASS: owner/enrollment authoritative | PASS: no server/session/role edits or ADMIN bypass; HTTP negative matrix retained |
| III Recoverable learning UX | PASS: clear pending/empty/error/drafts | PASS: D01–D07 and acceptance states; desktop remains required |
| IV Evidence quality | PASS: source/fixture/live separate | PASS: quickstart V01–V08 and open external gates; checklist is requirements quality |
| V Controlled data/scope | PASS: baseline/prior work preserved | PASS: frontend-only four source/test paths; no DB or dependency action |

Design compliance is not test success. No violations or exceptions.

## Project Structure

Feature artifacts: spec.md, plan.md, research.md, data-model.md, contracts/study-tools.md, quickstart.md, checklists/, tasks.md and verification.md.

Application implementation paths:
- frontend/src/components/DocumentAssistantPanel.jsx
- frontend/src/components/LessonSummaryPanel.jsx
- frontend/src/components/DocumentStudyPanels.css (new, scoped)
- frontend/src/__tests__/frontend.test.js

Read-only dependencies: app/App.jsx, pages/CourseWorkspacePage.jsx, services/api.js/apiErrors.js/lessonRequestGuard.js, ui/Button.jsx/Feedback.jsx, pages/LearningApp.css, index.css, App.css; backend production routes/middleware/source utilities/Prisma. No CourseWorkspacePage or shared guard changes planned.

## Design decisions and acceptance

- **D01 Hierarchy**: light workspace header with lesson title and close; short local-capability note; history heading/count/reload, history region, new reply control, then compact visible-label two-row textarea/send. Answers full readable width, question subdued and clearly labeled. Summary header, short extractive explanation, source strip and sentence list/empty/recovery. Use existing blue/navy/neutral palette, Inter body,16px readable content and consistent12–20px spacing. No sticky overlay or mobile feature. FR002/013/016, SC001/005.
- **D02 Context/operations**: wrapper keys lesson ID/sourceRevision; parent already keys course. Distinct guards for history/send and immediate request locks; cleanup/close invalidate both. Summary cancels/invalidates reads and resets through key. No old context state visible. FR004/008/015, SC002/003/004.
- **D03 Reconcile/drafts**: ID-deduplicated chronological latest50, server snapshot plus bounded confirmed local sends; failures keep transcript. Increment edit generation on every input event; earlier success clears only same generation. Draft remains while mounted, no localStorage/unload promise. FR003–005/009/010/012, SC002/003.
- **D04 Scroll/recovery**: persistent focusable history region, preserve visible message anchor/scrollTop away from bottom; follow at≤56px; genuinely new IDs trigger latest action, which scrolls and focuses latest answer without automatic focus theft. History reload never resends POST; uncertain failure explains check-history-before-explicit-resend. FR006/010/016, SC002/005.
- **D05 Summary/source**: label local extractive sentences; DOCUMENT/LESSON_CONTENT labels only when supplied; truncation note only when true, point pages only supplied positive pages (no links). Empty points success preserves metadata.422 unavailable uses generic source explanation/no OCR; other errors retain useful request text. Retry has synchronous gate. Known revision mismatch shows changed-source recovery, no stale points. FR011/013–015, SC004.
- **D06 Accessibility/states**: labeled textarea, 3–1000 trimmed validation and counter/help, aria-describedby/error, pending send button while next draft stays editable. Buttons reuse Button; no whole-history live region. Concise LoadingState/StatusMessage/error announcements, keyboard scroll/latest/close and scoped :focus-visible. No new dialog; existing quiz native dialog regressed. FR007/008/016, SC003/005.
- **D07 Navigation/authority**: keep current open/close callbacks, URL panel keys and quiz leave gate; no source processing or permission writes. Preserve no-match text verbatim and historical provenance note. Source revision changes reset panel draft as existing lifecycle; summaries with older returned revision are withheld. FR001/005/011/012/015/017, SC006.
- **D08 Verification**: baseline full npm test before edits; meaningful deferred-response component cases then required full npm test/lint/build. Current desktop two roles×two sizes, long content/scroll/focus/native dialog, outside-panel regression and HTTP ownership/enrollment/private history remain mandatory. Missing runtime/session/resource leaves tasks open; integration provisioning/cleanup requires separate scope authorization. FR018, SC001–007.

## Risks and mitigation

- Non-idempotent POST may commit before a network error/close: explain uncertainty, retain draft and provide read-only history reload; never automatically replay or promise cancellation.
- History/source provenance absent for chat: preserve messages, show generic historical-source caveat, never infer citations.
- Latest50 window may evict oldest displayed messages: bounded reconciliation; reading anchor preserved when still present, otherwise retain bounded scroll position. No older-history fetching.
- API client drops extractionStatus: use available status/code/message, no new data fields/client contract.
- Out-of-order reads/sends or close/source switch: separate guards, edit counter, keyed lifetime, tests of both response orders and old failure/finally.
- Native layout/focus/scroll cannot be certified by jsdom. Keep current live evidence gates open when browser/runtime unavailable.

## Complexity Tracking

No constitution violation; reuse existing architecture and dependencies. Research/design complete; tasks/analysis precede implementation.

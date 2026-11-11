# Implementation Plan: Targeted responsive accessibility

## Summary / Technical Context

React19/CSS and existing Chrome/CDP harness, no dependency/API/schema change.
AuthPage/ResetPasswordPage→AuthEntryShell/AuthEntry.css→unchanged SessionContext/
API/production auth. Role screens already have responsive styles; survey before
changing them. lumina-ui-design baseline observed37.8px input at390px.

## Constitution Check

I no contract mutation; II permissions untouched; III measured narrow fix and
desktop identity retained; IV full frontend+real browser; V no private data,
provider call or existing volume/profile deletion. Pre/post-design PASS.

## Project Structure / selected design

- frontend/src/pages/AuthEntry.css: max-width760px one-column grid; page16px,
  story20px and form28px24px padding, compact heading; remove narrow decorative
  illustration/caption only, preserve all form/brand/content. Desktop unchanged.
- frontend/src/App.css and pages/LearningApp.css/AuthEntry.css: scoped reduced
  motion for spinner/progress/card/form transitions; no blanket disabling focus.
- Existing production components/session/quiz/API remain unchanged.
- verification.md records public auth baseline and isolated role/motion evidence.

## Evidence-based remediation refinement

Isolated Chrome reproduced390px header logout right405px and assignment grading
content right661px. Add max640px header navigation grid/profile constraints in
LearningApp.css and stack aw-layout/aw-submission-layout/grade/form rows in
components/AssignmentsPanel.css; wrap existing heading actions. Preserve desktop,
DOM order and every control; do not hide overflow. User preauthorized in-scope
remediation after analyze. This refinement is outside read-only analysis.

## Risks and verification

No page overflow alone is insufficient: assert input width and visual word
wrapping. Test auth login/register/forgot/missing-reset at four widths and preserve
desktop two columns. Browser emulate reduced motion and computed spinner style,
with accessible status text still present. Existing component regression covers
native dialogs/focus, error/empty, pending and stale outcomes; do not invent new
live provider success. Use isolated seeded HTTP/database+Chrome role views.
Full frontend npm test/lint/build; no backend source change. No extra dependency.

## Complexity Tracking

One responsive override and scoped preference rules. No model/contracts artifact
because no data/API behavior changes. Native-dialog suspicion not treated as defect.

# Implementation Plan: Feature-oriented tests

## Summary / Technical Context

React19/Vitest4/jsdom/RTL, existing Node service tests and ESLint. Parse original
non-JSX test source using already-installed ESLint parser/scope tools for one-off
extraction; no parser dependency or generator committed. npm test glob unchanged.

## Constitution Check

I no production contract change; II preserve access regressions; III preserve UI
and lifecycle tests; IV statement equality/count+actual tests; V synthetic data
only. Pre/post-design PASS, no exceptions.

## Project Structure and design

frontend/src/__tests__/fixtures.js holds existing imports/helpers/afterEach cleanup,
with named exports; feature test files import only unresolved referenced bindings.
Files: authEntry,session,dashboard,workspace,assignments,quiz,documentStudy,account,
admin tests. Existing googleAuth/DemoCloud files remain separate unchanged.
Original frontend.test.js removed only after exact statement hash/membership
comparison. test.each and loop blocks moved as whole nodes, not expanded/rewritten.

docs/continuous-integration.md gains honest coverage map. No workflow permissions,
timeouts or required gates weakened; existing frontend npm test discovers all
files. Backend auth coverage is separate014; no cherry-pick of security changes.

## Risks and verification

Shared fixture import side effects register cleanup in each isolated test file.
Scope analysis avoids unused/shadowed imports. Run standalone feature file and
full suite, compare execution totals; lint/build, backend/quiz/CI-safety. No UI
change or integration harness change, so previous runtime matrix remains
historical; new hosted integration confirms this revision once pushed.

## Complexity Tracking

No framework/dependency/schema/public contract changes. Test extraction only.

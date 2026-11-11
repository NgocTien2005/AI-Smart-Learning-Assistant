# Feature Specification: Feature-oriented regression tests

**Feature Branch**: test/quality-ci
**Created**: 2026-11-09
**Status**: Reviewed
**Input**: Portfolio E/A test-maintainability targets, audit AUD05/07.

## Problem, goals and non-goals

A single3260-line component test file mixes independent learning workflows.
Make failures discoverable by feature and preserve every assertion/variant and
CI gate. No production change, dependency/schema upgrade, test weakening or
real provider requests. Production auth port belongs to014, not duplicated here.

## User Scenarios & Testing

### User Story 1 - Locate a failing workflow (Priority: P1)

As a developer I can run auth, dashboards, workspace, assignments, quiz, study,
account or admin regressions separately with shared synthetic fixtures.
**Independent Test**: Named feature module executes its original assertions.
**Acceptance Scenarios**:
1. Given the existing suite, when organized, then every test statement and loop
   variant remains byte-equivalent and all original tests still execute.
2. Given shared helpers, when files execute independently, then cleanup/fetch,
   timers and storage are isolated and tests do not rely on cross-file order.

### User Story 2 - Trust CI evidence (Priority: P1)

As a reviewer I can map each quality gate to actual production coverage/limits.
**Independent Test**: Full frontend/backend and hosted job evidence, not checkbox count.
**Acceptance Scenarios**:
1. Given a PR, when CI runs, then all feature files are discovered, lint/build
   remain mandatory and HTTP/database/provider evidence stay distinct.
2. Given legacy auth assertions, when coverage is documented, then their
   production replacement in014 is explicitly required before claiming coverage.

### Edge Cases

Parameterized test.each/for loops, helper declaration ordering, mutable globals,
worker isolation, unused imports, nested fixture paths, reused timers/fetch stubs.

## Requirements

- **FR-001**: Group existing frontend tests by auth/session/dashboard/workspace/assignment/quiz/study/account/admin responsibility with reusable synthetic fixtures.
- **FR-002**: Preserve all assertions, parameterized variants and cleanup behavior; no skipped/disabled/weakened tests.
- **FR-003**: Existing npm test/CI must discover every module; lint/build/backend/quiz and isolated HTTP/database gates remain required.
- **FR-004**: Document exact coverage/commands and production-vs-legacy/provider limitations, including014 prerequisite.

### Non-functional, security and compatibility requirements

No external data/provider or private configuration access. Existing dependencies
only; no generated parser/tool output committed. Test organization only, no UI or
API/schema changes. Max worker count may be bounded explicitly for local memory
only if all tests still execute; default isolation must remain enabled.

### Key Entities

Synthetic fixture/shared cleanup module; feature test module; statement inventory
with hashes and original-to-new mapping. No persistent domain model change.

## Success Criteria

- **SC-001**: Original test statements/loop variants unchanged; total executed test count matches baseline.
- **SC-002**: Full frontend tests/lint/build and existing CI safety checks pass; hosted exact-SHA gates recorded separately.

## Clarifications

2026-11-09: all scope/privacy/compatibility categories clear, no questions.
No new testing framework or production-auth duplicate. Existing Google/Gemini
real-provider gates and008 cleanup restriction remain untouched.

## Known constraints

Independent audit-base branch;014 provides production auth regression separately.
Do not imply this test-only branch alone removes the legacy auth harness.

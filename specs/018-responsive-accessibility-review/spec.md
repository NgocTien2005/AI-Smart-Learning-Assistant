# Feature Specification: Responsive authentication and motion preference

**Feature Branch**: refactor/frontend-ux
**Created**: 2026-11-10
**Status**: Reviewed
**Input**: Portfolio C; preserve visual identity and existing authentication.

## Problem, goals and non-goals

At390px the current auth two-column shell squeezes the email input to37.8px and
wraps words into single letters despite no document overflow. Make narrow auth
usable while preserving desktop identity, every field and existing API behavior.
Respect reduced-motion preference in existing loading/progress affordances.
No desktop redesign, new auth/provider/API/schema/dependency or changed session.

## User Scenarios & Testing

### User Story 1 - Use auth on a narrow screen (Priority: P1)

As a user I can read and operate login/register/recovery/missing-link forms.
**Independent Test**: Chrome at390×844/768×1024/1280×800/1440×900.
**Acceptance Scenarios**:
1. Given390px width, when an auth mode opens, then email fields are at least250px
   wide, content is not clipped and no page horizontal overflow occurs.
2. Given1280/1440 desktop, when auth opens, then the existing two-column layout
   and410px email field remain; labels/actions and keyboard focus are retained.

### User Story 2 - Keep learning workflows accessible (Priority: P1)

As a user preferring reduced motion I retain explicit loading/status feedback
without continuous spinners or unnecessary progress/card motion.
**Independent Test**: Browser-emulated motion preference and existing role flows.
**Acceptance Scenarios**:
1. Given reduced-motion preference, when loading UI is present, then spinner
   animation is disabled and accessible status text remains; default motion
   presentation remains unchanged otherwise.
2. Given three-role seeded workflows at narrow/desktop sizes, when opened, then
   navigation/forms remain usable and failures/stale state still use existing guards.

### Edge Cases

Register extra fields, long Vietnamese labels, missing reset token, Google disabled,
scrolling instead of clipped input, native keyboard dialog focus, reduced motion,
viewport changes, empty/error states covered by existing components.

## Requirements

- **FR-001**: Auth below760px MUST use one readable column with every existing control retained; at390px email input>=250px, no horizontal overflow.
- **FR-002**: Desktop1280×800/1440×900 MUST retain two columns and original visual identity/410px input; auth/session/reset/Google behavior and URL contracts unchanged.
- **FR-003**: Respect prefers-reduced-motion for existing spinners, progress/card/form transitions without hiding status text, removing focus or disabling controls.
- **FR-004**: At390px existing role screens MUST keep navigation/profile/logout and assignment reading/grading controls within the page width; stack narrow fixed-column regions where reproduced overflow occurs. Retain test-backed loading/empty/error/success/duplicate/stale/keyboard behavior; record limits rather than redesign without evidence.

### Non-functional and security requirements

CSS-only application change; no new requests or sensitive data. No real email,
Google or Gemini operations. Only run-owned synthetic fixtures/fresh browser
profiles; historical blocked profiles untouched. No private dev backend recreate.

### Key Entities

Viewport/motion preference and existing auth/role UI states; no new persistent model.

## Success Criteria

- **SC-001**: Measured auth input widths and columns satisfy all four viewport acceptance cases; before/after captures inspected.
- **SC-002**: Full frontend tests/lint/build and real three-role browser matrix pass; motion computation matches preference and existing provider/cleanup gates stay open.

## Clarifications

2026-11-10 scope/privacy/data categories clear: responsive explicitly requested,
desktop redesign excluded, native-dialog suspected duplication remains a review
recommendation unless reproduced. No behavior patch solely from suspicion.

## Known constraints

5173 was unreachable in initial survey, so public8080 current auth supplied
baseline geometry; no private/session fields entered. Final acceptance uses a
fresh isolated stack built from this source. Actual Google/Gemini remain separate.

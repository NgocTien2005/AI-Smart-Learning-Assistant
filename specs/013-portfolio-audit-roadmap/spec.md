# Feature Specification: Verified portfolio audit and roadmap

**Feature Branch**: portfolio/00-audit-speckit
**Created**: 2026-11-09
**Status**: Reviewed
**Input**: User portfolio improvement workstreams A–G.

## Problem, goals and non-goals

Maintainers need evidence of actual quality and a safe incremental roadmap.
Deliver a verified baseline and reviewable findings; later independent features
implement code. No deployment, main changes, merging, data/provider writes,
constitution rewrite or tool upgrades in this feature.

## User Scenarios & Testing

### User Story 1 - Understand current quality (Priority: P1)

As a maintainer I need source-backed or reproducible findings.
**Independent Test**: Reproduce public input probes and inspect source references.
**Acceptance Scenarios**:
1. Given current source, when audited, then each finding has severity, files,
   evidence, cause, solution, risks, acceptance criteria and required tests.
2. Given old acceptance, when summarized, then dated continuations are included
   and original blockers remain in their original features.

### User Story 2 - Review incremental work (Priority: P1)

As a reviewer I need a dependency-ordered roadmap and independent branches.
**Independent Test**: Map all seven groups to priorities and Git/verification paths.
**Acceptance Scenarios**:
1. Given verified main, when audit is published, then a separate branch/commit/PR
   contains the audit and main remains unchanged.
2. Given an unmerged prerequisite, when dependent work starts, then PR base and
   temporary dependency are explicit.

### Edge Cases

Dirty baseline, unavailable provider/hosted checks, stale reports, cleanup policy
blocks, branch names differing from feature resolver state.

## Requirements

### Functional Requirements

- **FR-001**: Inspect instructions, artifacts001–012, production paths, packages,
  tests/configuration/Git and capture baseline.
- **FR-002**: Require all eight finding fields in US1-AC1; distinguish confirmed
  defects, source-confirmed security gaps and recommendations.
- **FR-003**: Cover A–G priorities/dependencies/branches/verification; preserve
  original acceptance evidence and blocked tasks without duplicates.
- **FR-004**: Commit audit and propose review without changing main or discarding work.

### Non-functional and security requirements

Zero database/provider writes during audit; no secrets/private requests/profiles
in evidence. Commands/cwd/exit outcomes recorded. Stable finding identifiers.
Compatibility: no application behavior/schema change in audit.

### Key Entities

Finding: ID, severity, classification and eight fields. Roadmap workstream:
priority, dependencies, branch, tests and script-allocated feature when started.

## Success Criteria

- **SC-001**: Every finding contains all fields and runtime claims identify method/revision.
- **SC-002**: All seven workstreams have safe Git/verification paths; no blocker silently closes.

## Clarifications

2026-11-09: scope, data, security, compatibility and completion taxonomy clear
from user instructions; zero critical ambiguities, zero questions needed.
Numeric abuse limits belong to the next security plan.

## Known constraints

Single-machine development; two npm packages; no public infrastructure/provider
acceptance inferred from CI. Historical policy restrictions persist.

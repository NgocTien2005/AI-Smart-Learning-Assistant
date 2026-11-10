# Feature Specification: Evidence-based portfolio handoff

**Feature**:020-portfolio-readiness | **Created**:2026-11-10 | **Status**:Specified
**Git branch**:docs/portfolio-readiness; documentation depends on explicitly published portfolio/integration-review.

## Problem, goals and non-goals
Recruiters need an accurate, navigable account of what Lumina implements, why decisions were made and what was verified. Existing README starts with an ambiguous no-external-AI claim despite the optional synthetic Gemini demo and lacks a coherent technical demo/decision guide.
Goals: source-matched architecture/ERD/auth/role description, reproducible three-role demonstration, exact verification and feature/commit/PR traceability. Non-goals: new product behavior, screenshots/benchmarks/deployed URLs not observed, deployment, automatic merge, new provider calls, secret collection or reopening historical accepted email work.

## User Scenarios & Testing
### US1 ? Understand the project (P1)
As a reviewer I can follow README links to actual architecture, data model, authorization, test strategy and engineering decisions.
Acceptance: documents identify runtime entrypoints and all persisted domain relations; distinguish four study capabilities and real-provider gates; links resolve and setup commands match packages/Compose.
### US2 ? Demonstrate and discuss it (P1)
As a candidate I can follow Instructor?Student?Admin with synthetic data and explain tradeoffs and limits honestly.
Acceptance: local private credential provisioning, role boundaries, assignments/quizzes/documents and optional cloud/provider conditions are explicit; no credentials, invented successful external responses or public deployment claim.
### US3 ? Review completed work (P1)
As a maintainer I can identify each feature's tasks, branch, commits, PR, tests, resource retention and remaining blocker.
Acceptance: before/after report distinguishes confirmed fixes from recommendations, exact hosted commits from local evidence and integration-branch compatibility from independent passes.

## Requirements
- **FR-001**: README and docs/portfolio-overview.md plus docs/architecture.md describe actual implementation, stack, setup, ERD, authentication and object authorization with source references.
- **FR-002**: docs/interview-guide.md and docs/demo-script.md provide an honest reproducible three-role walkthrough, engineering decisions and four distinct study capabilities/limits.
- **FR-003**: docs/portfolio-improvement-report.md records task/branch/commit/PR/verification matrix, before/after, retained resources and unresolved provider/cleanup/production conditions. Independently verify compatibility of combined feature code before presenting it as a usable reference branch.

## Non-functional/security/compatibility
Documentation only on this feature branch; integration branch preserves separate feature commits and has no omnibus merge PR. No API/schema/dependency/data changes, secret dumps, provider calls or historical profile cleanup. Existing main/user branches remain untouched. Distinguish test doubles/offline fixtures from real model evidence.

## Edge cases and assumptions
Missing provider configuration is a documented blocked acceptance, not fake success. CI outcome must identify exact SHA; later docs commits do not retroactively change tested revision. Broken local links and stale entrypoints fail document review. Existing private demo runtime is not recreated merely to show the candidate branch.

## Clarification review ? 2026-11-10
No critical ambiguity: user explicitly requested these documents and separate feature review. Unmerged dependencies are combined only on a named temporary integration branch; documentation PR targets it, not main. Public deployment, real provider and original cleanup gates remain deferred.

## Success Criteria
- **SC-001**: All relative links in newly written portfolio documents resolve and technical claims map to source/evidence.
- **SC-002**: The walkthrough covers all three roles without disclosing private credentials or claiming an unobserved provider/deployment result.
- **SC-003**: Every improvement group has a reviewable traceability row; combined compatibility checks either pass with evidence or are explicitly left incomplete.

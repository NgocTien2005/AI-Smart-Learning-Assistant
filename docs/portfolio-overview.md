# Lumina LMS — portfolio overview

Lumina is a Vietnamese learning-management application for instructors who need
to publish lessons, collect assignments and track students without combining
separate tools. Students read protected materials, resume quizzes and see
progress; administrators manage accounts. It is a development/demo project,
with locally and CI-verified workflows and explicit production limitations.

## What can be demonstrated

| Role | Implemented workflow | Boundary |
| --- | --- | --- |
| INSTRUCTOR | Own courses/lessons, invitation code, documents, roster, assignments and grading | Another instructor's course remains protected |
| STUDENT | Enroll, read/download, mark progress, submit assignments, resume/submit quizzes | Enrollment is rechecked on protected operations |
| ADMIN | Search/edit/disable accounts and change roles | Account administration does not bypass course content ownership |

Email/password authentication, recoverable session loading, password recovery
and account settings are implemented. Google is optional and only signs in
existing accounts that explicitly linked their Google identity. There is no
automatic registration or email-based account merge.

Four different study capabilities must be described accurately:

| Capability | Implementation | Limit |
| --- | --- | --- |
| Document lookup | Local normalized token retrieval with source passages | Not general language understanding |
| Summary | Extractive source sentences | Not an LLM paraphrase |
| Practice quiz | Definition-pattern generation, persisted snapshot/draft/version | May generate fewer questions than requested |
| Cloud demo | Optional server-side Gemini adapter, original synthetic sources and finite actions only | Real model acceptance remains open; no private-document egress |

PDF processing extracts text layers, with size/page/output limits. There is no
OCR. Offline AI evaluation validates deterministic retrieval and output
contracts; it does not establish real model accuracy.

## Technical evidence

The stack uses React19, React Router7, Vite8, Express5, Prisma7 and PostgreSQL17;
Node24 is used by Docker/CI. Frontend component tests use Vitest/jsdom/Testing
Library; backend tests use Node's runner. GitHub Actions runs frontend,
backend and isolated HTTP/database jobs with test-only secrets and restricted
permissions. An additional synthetic recovery drill covers DB and upload files.

The portfolio improvements extracted route/component responsibilities, moved
auth regressions to production code, added bounded abuse controls, retained all
frontend regression statements while organizing them by workflow, corrected
reproduced responsive layouts and added source-grounding evaluation. See the
[improvement report](portfolio-improvement-report.md) for precise commits and
the distinction between independent PRs and their combined reference branch.

## Explore the project

- [Architecture, ERD and authentication](architecture.md)
- [Module boundaries](module-boundaries.md) and [security decisions](security.md)
- [Three-role demo script](demo-script.md) and [interview guide](interview-guide.md)
- [CI and coverage](continuous-integration.md), [AI evaluation](ai-evaluation.md)
- [Synthetic dataset](demo-data.md), [optional cloud setup](demo-cloud-ai.md),
  [Google setup](google-sign-in.md)
- [Operations](operations.md) and [production readiness](production-readiness.md)

No public deployment URL, benchmark, security certification or successful real
Google/Gemini acceptance is asserted. Historical email recovery acceptance is
preserved separately from current SMTP configuration and public-release checks.

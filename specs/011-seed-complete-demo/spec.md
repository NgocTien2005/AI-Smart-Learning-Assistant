# Feature Specification: Complete synthetic LMS demo

**Feature**: 011-seed-complete-demo (official allocation)
**Created**: 2026-11-08
**Status**: Clarified
**Input**: Seed the existing app comprehensively and safely; preserve all existing data and access controls.

## Clarifications

### Session 2026-11-08

- No business clarification needed for seed: the user explicitly authorizes additive synthetic development/demo data, not production, reset or overwriting existing accounts. AI provider consent is a separate pending decision and does not block seed.
- Private access means generated demo passwords appear only in a dedicated local terminal, never chat, evidence, source or credential files. Reruns do not reset them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview and safely create a demo (Priority: P1)

An operator previews the exact dataset and applies it only to an explicitly verified local development target.

**Why this priority**: More data must not damage the existing app.
**Independent Test**: Dry-run changes no rows/files. A valid apply adds its owned dataset; missing/mismatched/production targets and collisions are refused.

**Acceptance Scenarios**:

1. **Given** a verified local demo target, **When** previewed, **Then** counts and any collisions are reported with zero changes.
2. **Given** the target is missing, mismatched, remote, production or local8081, **When** seed is attempted, **Then** it is refused before writes.
3. **Given** unrelated records already exist, **When** the new demo is applied, **Then** all preexisting records/passwords/roles remain unchanged.
4. **Given** a concurrent seed or a namespace collision without proven ownership, **When** applied, **Then** it cannot adopt or overwrite those records.
5. **Given** the owned dataset exists, **When** rerun, **Then** it creates zero duplicate rows/files and preserves passwords and user edits.

### User Story 2 - Explore every existing LMS feature (Priority: P1)

ADMIN, INSTRUCTOR and STUDENT can use realistic synthetic content with varied learning/grading/quiz states and enforceable ownership.

**Independent Test**: The inventory covers the minimum counts and mounted APIs return valid content/states for each role, including cross-owner denials.

**Acceptance Scenarios**:

1. **Given** the dataset, **When** signing in as each role, **Then** dashboards/account/admin/course workflows use the actual original APIs and current permissions.
2. **Given** eight different courses, **When** opened, **Then** each contains six meaningful Vietnamese lessons, suitable examples, objectives and practice; valid PDF/text/Markdown/CSV materials are available.
3. **Given** different student enrollments, **When** reading or practicing, **Then** progress, no-submission, submitted, graded, quiz-draft/submitted/no-attempt states are consistent.
4. **Given** an unrelated instructor or unenrolled student, **When** requesting protected course content/material/attempts, **Then** the server denies access.

### User Story 3 - Receive private access and an auditable report (Priority: P2)

The operator gets synthetic demo access privately and a public safe inventory, while no email/provider request is triggered.

**Independent Test**: Public reports contain no credentials/tokens; a private terminal displays initial demo access, and reruns never silently rotate it.

**Acceptance Scenarios**:

1. **Given** an initial successful seed, **When** access is delivered, **Then** passwords are random per account and visible only in the dedicated local console; reports show identifiers/counts only.
2. **Given** a seed operation, **When** it completes or fails, **Then** safe command/target/ownership/outcome evidence is available without email, Google or AI network calls.

### Edge Cases

- Partial failures roll back database changes; any newly created orphan files are explicitly reported, never confused with existing uploads.
- A missing/edited registry, deleted seed record or changed ownership is a conflict requiring review, not permission to adopt/overwrite.
- Synthetic chat history is clearly labelled prepared demo content, not evidence of model generation.
- No account is linked to Google, no reset token/session is seeded, and no learner data is sent outside the machine.
- Cleanup is not executed without a separate user request and must use the exact ownership registry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Seed MUST require explicit target and demo purpose, verify local daemon, HTTP/container/network/storage and the backend's actual database, and refuse local8081/production/mismatch before writing.
- **FR-002**: Dry-run MUST be read-only and show expected counts and collisions.
- **FR-003**: Seed MUST be additive, create-only and atomic for database rows, with durable ownership; never overwrite/adopt unrelated users/courses/files.
- **FR-004**: Rerun MUST create zero duplicate rows/files, never reset credentials/roles, and report ownership conflicts without repair.
- **FR-005**: Dataset MUST include at least1 ADMIN,4 INSTRUCTOR,12 STUDENT,8 distinct courses and5–8 lessons per course; choose six per course. One additional disabled synthetic student may illustrate admin locking.
- **FR-006**: Lessons MUST contain original Vietnamese objectives, explanations, examples and practice, not lorem ipsum; sources MUST support existing local lookup/extractive summary/quiz where stated. PDF must have a real readable text layer, not OCR.
- **FR-007**: Enrollment/progress/assignments/submissions/grades and draft/submitted/unstarted quizzes MUST follow existing source/snapshot/version/grading contracts, including meaningful empty states.
- **FR-008**: Role and resource authorization MUST remain unchanged and be exercised across different owners/enrollments; ADMIN receives no new content bypass.
- **FR-009**: Demo credentials MUST be runtime-generated per account and shown only in a dedicated private local console. No plaintext credentials/tokens/requests go to source, reports or files.
- **FR-010**: Seed MUST NOT send recovery email, Google requests, external AI requests or process real user documents. Synthetic email addresses use a non-deliverable namespace.
- **FR-011**: Reporting MUST distinguish fixtures, real HTTP/database, private console access, UI and hosted CI; retain exact owned cleanup limits. No automatic app-startup seed or cleanup.

### Key Entities

- **Demo dataset**: Versioned ownership registry of created IDs, stable synthetic identities and files; no credentials.
- **Synthetic users/content**: Existing LMS entities under the registry, with normal passwords and authorization.
- **Private initial access**: Ephemeral generated passwords delivered through a local console, never a reporting artifact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least17 synthetic accounts,8 courses and48 meaningful lessons exist without altering preexisting records.
- **SC-002**: Repeated apply adds zero records/files and preserves original credentials; denied target/collision/dry-run cases write zero rows/files.
- **SC-003**: All three roles complete relevant read flows and every negative ownership/enrollment case in the verification matrix is denied.
- **SC-004**: Required backend/quiz/schema/build/integration and current browser observations are recorded accurately, with zero email/provider sends and zero plaintext credentials in evidence.

## Assumptions

- The local app is the verified default Docker8080 project reached by Vite5173. Explicit development purpose is required even though Docker runs NODE_ENV=production for build/runtime optimization.
- Existing small demo data is preexisting data and remains untouched; the new version uses a separate namespace.
- New AI functionality and real Google/SMTP configuration are separate features; existing008 T023 historical acceptance/T026 cleanup and010 T016 provider gate remain unchanged.

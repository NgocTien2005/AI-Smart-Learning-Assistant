# Implementation Plan: Portfolio audit

## Summary

Read production source and existing artifacts, reproduce malformed auth input
with ephemeral loopback production app and unreachable synthetic DB URL, publish
docs/portfolio-audit.md and safe roadmap. No application changes/migration.

## Technical Context

Specify1.2.3, PowerShell5.1, Node24+, Git/gh; React19/Express5/Prisma7.
Baseline68bde85 equals fetched origin/main, clean tree; hooks absent.

## Constitution Check

I production paths traced; II auth/resource permissions reviewed; III no UI
change; IV source/runtime/hosted evidence separated; V no secret/data writes.
Pre/post-design PASS, no exceptions.

## Project Structure

docs/portfolio-audit.md and this feature's spec/plan/tasks/research/quickstart/
verification/checklists. Ignored .artifacts/portfolio-audit-20261109 baseline/probe.

## Design and sequence

Discovery → reproduction/findings → roadmap → analyze → commit/review.
Next independent branches depend on audit documentation only and target its
branch until reviewed; no automatic merge/main writes. Combined checks may use
an explicitly named integration branch with exact commits recorded.

## Risks and verification

Do not treat task counts or early historical pending sections as current proof.
Verify links, fields, source references and git diff; no app suite for docs-only.
No data-model/contracts artifact: internal audit has no new external interface.

## Complexity Tracking

No dependencies or constitution exceptions.

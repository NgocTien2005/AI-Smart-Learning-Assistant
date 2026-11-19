# Feature Specification: Targeted runtime security patches

Created2026-11-17. Branch security/runtime-advisories temporarily stacked on0239b238d5; intended PR base chore/self-host-deploy-kit.

## Problem and scope

Production npm audit reports6 affected package entries: body-parser,multer,pdfjs-dist High; nodemailer,qs,fast-uri Moderate. User asks to complete safe work before self-deploy. Patch these targeted dependencies, no blanket upgrade/audit fix--force, schema/API/password/role change or suppressed guard. Audit is dependency evidence, not exploit reproduction. Preserve local tools, uploads/downloads, auth/email, quiz and Gemini.

## User Scenarios & Testing

US1(P1): Operator installs reproducibly with no currently reported production advisory. Independent test: npm ci and production audit; patched direct/transitive versions within intended scope. Missing registry/network must remain a reported blocker, not a clean audit.

US2(P1): Users retain protected PDF/TXT extraction, upload validation, email/reset and LMS workflows. Independent test: actual parser fixtures, production-router tests, quiz and isolated HTTP/database on rebuilt Node24 image. Invalid files/oversize/timeouts/access denied still rejected. No real email or provider request for regression.

## Requirements

- FR001: Pin targeted direct fixes multer2.5.0,nodemailer10.1.4,pdfjs-dist6.2.108; refresh body-parser,qs,fast-uri within existing parent ranges. Keep Express/Prisma/React versions and other direct dependencies unchanged.
- FR002: Review PDF.js6 major compatibility against Node24/legacy getDocument/getTextContent and bounded text extraction; preserve text-only/no-OCR/privacy/size/page/timeout behavior and review obsolete isEvalSupported option against6 API and protected access.
- FR003: npm ci, full backend, quiz, production audit and existing CI/config safety tests must pass without schema/API changes or real provider calls. Do not claim audit proves vulnerability-free/security certification.
- FR004: Rebuild image and run health + verified isolated HTTP/database/PDF/upload/assignment/quiz/auth suite before public release. Keep pending while Docker unavailable, never weaken tests.
- FR005: Update release/deploy guidance with exact versions, before/after audit, compatibility scope and remaining runtime/hosted tasks; small commits, no destructive cleanup/remote credentials bypass/deployment.

## Non-functional/security/compatibility

Existing data/users/migrations preserved. Secret input stays private; no .env/container-env reads. No seed, SMTP/Gemini calls or local8081 operations. Old PDF viewer scripting advisory requires viewer scripting conditions; current backend uses text-only API, so do not fabricate a reproduced exploit. Version6 major update requires actual fixture and Docker integration evidence. No new application dependency; lockfile changes intentional and reviewed.

## Success criteria

SC001: Deterministic install succeeds and npm audit --omit=dev reports0 at recorded date/revision, or remaining advisories explicitly blocked.
SC002: Text/PDF and production auth/access/quiz regressions pass; isolated rebuilt image acceptance pending if environment unavailable.
SC003: Accurate deployable-source guidance and no fake hosted/runtime/public success.

## Clarifications

Latest user authorizes completing safe missing work and chose VPS Ubuntu. Narrow patch versions are driven by actual audit/advisories, not unrelated feature expansion. No critical product ambiguity. Docker operator recovery is pending, not approval to skip FR004 or public deploy.

# Implementation Plan: Safe operation foundations

**Feature**: [spec.md](spec.md) | **Date**: 2026-11-10
**Base**: verified origin/main d407a1c; independent chore/deployment-foundations.

## Technical context and constitution
Node24, Express5/Prisma7/PostgreSQL17, React19/Vite8, Nginx1.27. UI ? Nginx /api ? production src/app.js ? guards ? Prisma remains unchanged. No dependency/schema/migration/API change. Constitution review before/after design passes: preserve data/contracts, explicit isolated target, no private egress, real evidence. extensions.yml absent; no workflow hooks registered.

## Design and affected files
1. frontend/nginx.conf: allowlisted JSON access records (status/duration/bytes only), error_log /dev/null at HTTP scope to suppress request-bearing native errors, server_tokens off; add_header always nosniff/no-referrer/SAMEORIGIN/device restrictions. Hide duplicate upstream nosniff/referrer. No untested CSP/COOP/HSTS.
2. compose.yaml and compose.acceptance.yaml: json-file max-size 10m/max-file 3 for each service, new containers only. Do not recreate private development stack.
3. scripts/ci/operations-check.mjs: fresh unique acceptance project/lifecycle, synthetic secrets, real HTTP/database identity resolver, synthetic DB fixture, binary-safe pg_dump/pg_restore into a new unique DB and upload archive/digest comparison. Verify nginx config, headers, log canaries and actual logging options. Publish only allowlisted summary. Down own project without -v; retain restore DB/volumes explicitly.
4. docs/operations.md and production-readiness link: release, rollback, backup consistency, least privilege, restricted diagnostics and remaining conditions.

## Risks and verification
Suppressing request error logs loses detail; sanitized status/duration remains. Real Google behavior remains separately gated. New restore DB retained with synthetic fixture only. No claim of production backup consistency or recovery objectives. Run target guard tests, actual rebuilt fresh-stack drill and existing isolated LMS integration including protected documents. Compose config --quiet with empty env/synthetic secrets; never print resolved environments. No frontend JS/CSS changes; no unrelated browser redesign tests. Hosted run recorded by exact SHA separately.

## Dependencies and artifacts
Independent from other portfolio branches; no silent stacking. research.md documents official references and tradeoffs; data-model.md describes temporary fixture only; contracts/operations.md specifies command/evidence; quickstart.md is validation guide. No managed skill/template edits.

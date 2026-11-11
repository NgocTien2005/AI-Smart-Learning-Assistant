# Main consolidation — 2026-11-11

The owner explicitly authorized merging all completed code into `main` and
rewriting README. This changes the earlier no-merge instruction for this
operation; no deployment, force-push, secret disclosure or destructive data
operation is authorized or performed.

## Included histories

- `main` at `eeccc5b`: operations019 and earlier main history.
- `portfolio/integration-review` at `829b815`: integrated application014–019 and
  portfolio020 documentation, including merged PR12.
- `portfolio/00-audit-speckit` at `66c2727`: merged security/testing/AI/UX and
  architecture replacement PR13. Original conflicting PR7 is closed as
  superseded; its branch/commits remain preserved.

The candidate branch is `integration/main-portfolio`. Merge commits `8481dc6`
and `ebbce42` retain both histories. Add/add conflicts affected only copied
SpecKit/module documentation:019 uses the integration version with corrected
separators;015 uses the newer current-base evidence/T007 from PR13. No runtime
handler, schema, package/lockfile, test or configuration was changed in resolution.

## Verification and README

Runtime frontend/backend source, backend tests, CI harness, Compose/Nginx,
Prisma schema/migrations and package/lockfiles are byte-identical to the
already verified integrated reference. Evidence:
[source comparison](../specs/020-portfolio-readiness/evidence/main-consolidation-source.json).
The candidate still receives fresh exact-SHA hosted frontend/backend/HTTP-DB
checks before the authorized main merge; resulting main CI is checked separately.
Local full suites/browser are not repeated solely for prose changes to identical
source.

README is rewritten in Vietnamese with roles, architecture, honest AI capability
distinctions, Docker/Vite setup, private demo/provider configuration, tests,
project structure and production limits. Relative links and commands are checked
against actual files/scripts. Historical reports remain dated snapshots.

The consolidation PR records the exact candidate SHA/run, merge execution and
resulting main SHA/run after those actions occur. This document does not
fabricate future results. Its PR link is added before publication closure.

## Boundaries preserved

No running development stack is recreated, provider request sent, old SMTP
budget reused or local8081 resource touched. No database, volume, branch or
policy-blocked browser profile is deleted. Main consolidation itself creates no
test dataset; hosted isolated runs retain their normal scoped cleanup rules.
Google010/T016, Gemini012/T012, cleanup008/T026 and production gates remain open;
email008/T023 historical acceptance remains closed.

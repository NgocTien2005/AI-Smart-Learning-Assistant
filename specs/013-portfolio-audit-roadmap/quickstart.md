# Audit validation

Repository root: git diff --check; review docs/portfolio-audit.md against source
at68bde85. Probe: production createApp on loopback port0, synthetic unreachable
DATABASE_URL/JWT secret, POST auth mutations without body; baseline500, no DB
queries. Close server/Prisma. Never use real accounts/provider calls.

gh run view 42651910401 --json headSha,conclusion,jobs checks baseline hosted CI
only. No application suite is needed for this documentation-only feature.

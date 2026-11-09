# Verify auth hardening

From backend: npm test; npm test -- --test-name-pattern="quiz"; npx prisma validate.
From root: node scripts/ci/integration.mjs builds a fresh isolated stack, verifies
HTTP/database identity, runs the existing integration harness and scoped cleanup.
No local8081 or dev stack recreation. No volume deletion.

Production factory tests exercise absent/object/password/role/reset/me contracts
with injected data boundary; these do not substitute for real DB integration.
No real email/provider acceptance in this feature. See docs/security.md.

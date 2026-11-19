# Quickstart

In backend: npm ci; npm audit --omit=dev; npm test; npm test -- --test-name-pattern=quiz. Root: node --test scripts/ci/test/*.test.mjs. Docker healthy: node scripts/ci/integration.mjs, verified fresh target with rebuilt images, never default DB/local8081. Keep real provider/email disabled in CI. Archive exact verified local source for staging only; public guide docs/deploy-vps.md still requires host acceptance.

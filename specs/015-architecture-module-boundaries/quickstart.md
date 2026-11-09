# Verify module extraction

From frontend: npm test; npm run lint; npm run build.
From backend: npm test; npm test -- --test-name-pattern="quiz"; npx prisma validate.
From root: node scripts/ci/integration.mjs; optionally set DEMO_BROWSER_ACCEPTANCE=1
and DEMO_BROWSER_EXECUTABLE to local Chrome, then node scripts/ci/seed-integration.mjs.
Fresh isolated HTTP/actual DB only; own resources cleaned, volumes retained.
Compare source handler inventory and assert no API/schema/layout change.

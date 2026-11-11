# Verify test organization

frontend: npm test; npm run lint; npm run build.
Standalone: npx vitest run src/__tests__/authEntry.test.js.
backend: npm test; npm test -- --test-name-pattern="quiz".
root: node --test scripts/ci/test/ci.test.mjs.
Compare statement hash inventory and total component tests with baseline226;
Node service tests5 and existing Google/cloud files remain included.
No browser rerun for test-only movement. Hosted CI exact commit reported later.

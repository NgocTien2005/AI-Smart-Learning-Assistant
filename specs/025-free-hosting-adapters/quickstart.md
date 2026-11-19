# Validation quickstart
Run backend npm test and npm test -- --test-name-pattern=quiz. Run isolated scripts/ci/integration.mjs with unique project and ignored evidence dir; harness creates secrets and validates actual DB/backend/network. Do not point it to local8081 or real provider. No live storage/email call in tests.

Follow docs/deploy-free.md for actual private operator setup. Complete upload/restart/download/revoke/replace and mailbox/reset/old-session/used-link acceptance on fresh hosted target. Do not send email before fresh recipient/budget authorization. Missing config keeps external acceptance open. No credentials in evidence.

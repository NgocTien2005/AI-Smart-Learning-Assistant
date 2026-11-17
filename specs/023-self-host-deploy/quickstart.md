# Quickstart verification

Run node --test scripts/ci/test/web-deploy.test.mjs: only synthetic Compose resolution, no daemon/provider/database changes. If bootstrap changes, backend npm test and npm test -- --test-name-pattern=quiz. Public steps belong in docs/deploy-vps.md; validate Caddy, migrate status, three roles/protected uploads/reset/chat and backup on operator staging before opening publicly. Missing engine/domain means runtime acceptance pending, never a fake pass.

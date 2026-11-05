# Verification guide
Follow AGENTS.md/lumina-verify; test credentials/tokens stay in automation memory.
1. Check baseline/resolver008.001–007 accepted at df570a1 is historical, not proof of changed008 code.
2. Read authorized checklist review; implement reads markers only.
3. frontend/: npm test; npm run lint; npm run build. Preserve full-suite outcomes and sanitized command/cwd/exit logs.
4. backend/: npm test; npm test -- --test-name-pattern="quiz". Legacy auth regression supplements production HTTP only.
5. Isolated Compose project lumina-acceptance-auth-20261103, http://127.0.0.1:8083, DB lumina_acceptance. Verify healthy labels/HTTP port/actual backend DB/own mounts and inequality versus local8081 before writes. Use backend/scripts/integration-target.mjs fail-closed helper. Never recreate backend/db using placeholder secrets.
6. Register own Student/Instructor by real UI/API, bootstrap own Admin only in verified DB; record public IDs/cleanup scope before further writes. No local credentials/storage reads.
7. Real Chrome1280×800/1440×900,100%, four forms; long content, focus/keyboard, pending/recovery. Save viewport-only screenshots with hidden passwords; record pathname only for reset and no query values. Measure after fonts settle.
8. Three-role routing, safe return/query/hash, history modes, duplicate/stale requests and GET-only recovery. Delayed/dropped real responses labelled instrumented; component/mock evidence separate.
9. Actual missing-SMTP503/429; no real emails. Prepare own generated reset hash/expiry only in isolated DB; label fixture, then real UI reset/login and old-session denial. Invalid/expired/used/general400 distinct. Actual delivery NOT RUN without safe configuration/recipient.
10. Full component suite plus healthy production HTTP integration regress001–007. Read backend/scripts/integration-check.mjs first; explicit TEST_COMPOSE_PROJECT/TEST_API_URL must match provisioning/cleanup DB, not HTTP only.
11. Update verification/traceability; tick only fully satisfied tasks. Converge append-only; missing external delivery explicit. Cleanup only recorded own test IDs; keep volumes, no reset/down-v.

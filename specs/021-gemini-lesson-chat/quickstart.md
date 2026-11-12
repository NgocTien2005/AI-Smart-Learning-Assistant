# Validation quickstart

1. Run package gates from repo root: `node scripts/ci/check-package.mjs frontend`, then backend; backend includes quiz regression. Run isolated `node scripts/ci/integration.mjs` and record actual HTTP/DB identity and cleanup, no8081.
2. Without runtime key: open an authorized lesson → Chat Gemini; select source and inspect disclosure/missing-config state. No model request should occur.
3. Configure privately with `powershell -NoProfile -File scripts/start-gemini-chat.ps1`, independently verify project billing disabled and do not use confidential/personal content. No keys in chat, files or browser.
4. In actual browser at1280×800/1440×900: select synthetic lesson source, acknowledge and ask two related free-text questions≥20s apart; inspect quotes/insufficient context. Test clear/cancel/source changes; do not save raw prompts/provider requests/screenshots with private data.
5. Record real-model acceptance separately from controlled tests. Missing key/quota/provider readiness keeps T007 open, not fabricated success. Old012 acceptance and008 cleanup remain separate.

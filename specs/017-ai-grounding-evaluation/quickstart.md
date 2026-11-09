# Run reproducible study evaluation

backend: node scripts/evaluate-study.mjs; npm test; npm test -- --test-name-pattern="quiz".
root: node scripts/ci/integration.mjs uses a fresh verified HTTP/database stack.
Evaluation uses fixed original synthetic fixtures, no provider key/network/DB.
Output is case IDs/capability/pass counts only; nonzero means failure. No raw
authenticated/provider request, model thoughts or private documents in evidence.
See docs/ai-evaluation.md for what real model acceptance still requires.

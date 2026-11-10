# Study capabilities and reproducible evaluation

| Capability | Implementation | What it cannot establish |
| --- | --- | --- |
| Local document lookup | Accent/case-normalized token overlap, stable ranking, top3 source passages | No paraphrase/general reasoning, synonyms or answer generation |
| Extractive summary | Selects source sentences, supplied page/revision metadata | No generated explanation or OCR |
| Practice quiz | Supported Vietnamese definition templates; snapshot/draft/version lifecycle | May find too few concepts; not an LLM |
| Optional Gemini demo | Explicit actions on unchanged original synthetic demo sources; bounded structured output and verified quotes | Real model factual quality not proven by offline tests or a nonempty key |

Run from `backend/`:

```powershell
node scripts/evaluate-study.mjs
npm test
npm test -- --test-name-pattern=quiz
```

The versioned original dataset is
`backend/test/fixtures/study-evaluation.json`.21 cases cover positive/negative
lookup, Vietnamese `Đ/đ`, substring false positives, empty/missing sources,
extractive provenance, supported/insufficient template quiz, fabricated citations,
explicit insufficient-context responses, duplicate cloud choices/questions and
modified instruction-bearing source refusal. The same cases run in ordinary
backend tests; no additional framework or provider key is needed.

The CLI reads only its fixed synthetic fixture; it does not accept private file
paths or call a network/provider/database client. Summary records IDs/capabilities
and pass/fail counts, never source documents, credentials, raw requests or model
reasoning. Failed cases return nonzero. Test wrappers forbid fetch; original-demo
ownership proof uses a synthetic in-memory registry, not a real database.
Template option order is randomized; evaluation checks invariant correctness,
not a hard-coded shuffled order. This small set is regression evidence, not a
comprehensive benchmark or model comparison.

## Quality changes

Local lookup now normalizes uppercase `Đ` consistently and compares whole tokens;
`RAM` no longer matches only the suffix of `program`. This deliberately reduces
substring recall; it still cannot infer semantic relevance. Stable passage order
and source-only output remain unchanged.

Cloud choices/questions must differ after Unicode NFC and whitespace normalization.
`Biến` versus ` Biến ` and canonically equivalent accent encodings cannot serve
as different options. Case-sensitive identifiers remain distinct. Existing type,
length, citation ID/quote, number-of-options/questions and answer-index bounds
still apply; invalid provider output fails explicitly, with no mock fallback.

## Real model review remains separate

Feature012T012 remains the acceptance owner. Only the operator's confirmed
unbilled free project and original synthetic demo scope are permitted. Never use
private documents, arbitrary questions, paid fallback or credentials in chat.
No automatic provider call is added to tests/CI or this evaluation CLI.

When real provider verification is performed under those conditions, review each
of ask/explain/summary/quiz for: Vietnamese clarity, claims actually supported by
quoted passages, no invented facts/citations, useful explicit insufficient-source
response, meaningful/distinct questions and correct answer/explanation. Record
only case ID, mode, observed outcome and reviewer judgement. Transport success
and quote substring matching do not establish entailment. Source instructions
must remain data, not authority; altered source is refused by original-demo proof.
Use [private setup](demo-cloud-ai.md); never log API key, raw prompt/response or
provider thoughts. A failed provider configuration or quota remains an honest
error, not a reason to claim AI success.

Actual before/after and isolated HTTP/database results:
[feature017 verification](../specs/017-ai-grounding-evaluation/verification.md).

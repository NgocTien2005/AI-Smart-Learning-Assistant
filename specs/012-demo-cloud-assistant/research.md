# Research
- Decision: pin gemini-3.8-flash, direct Interactions REST with Api-Revision2026-05-20, store:false, response_format JSON schema, no tools/history/SDK or automatic retry.
- Rationale: official current text-generation/structured-output docs use that model/API; pricing lists free input/output on free tier. Prior2.5Flash is deprecated/rerouted. No model fallback is permitted; live account availability still requires actual acceptance.
- Sources reviewed2026-11-08: https://ai.google.dev/gemini-api/docs/pricing ; https://ai.google.dev/gemini-api/docs/text-generation ; https://ai.google.dev/gemini-api/docs/structured-output ; https://ai.google.dev/gemini-api/docs/interactions-overview ; https://ai.google.dev/gemini-api/docs/migrate-to-interactions . Official markdown copies ignored locally; no source-user data sent.
- Privacy: free data may improve products. store:false disables interaction resource storage, does not override provider free-tier terms. Only exact synthetic source and finite requests sent.
- Alternatives: local model rejected by user cloud choice; paid tier/new SDK/general uploads/free text outside scope. Native fetch/stream/AbortController suffice.
- Limits: app cannot verify project billing or guarantee factual correctness from valid citations. Operator must use a free-only unbilled project; no paid tools. Requests bounded and no retries; errors honest.

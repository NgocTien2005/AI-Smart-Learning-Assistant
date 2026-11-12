# Research: Gemini lesson chat

2026-11-12; read-only research agent `chat_provider_research`, no provider request/secret access.

| Decision | Rationale | Alternative |
| --- | --- | --- |
| Keep gemini-3.8-flash, Interactions v1beta, Api-Revision2026-05-20 | Current official docs match installed adapter; no SDK/model upgrade | GenerateContent switch adds unnecessary transport change |
| store:false + explicit bounded history | Avoid server-side Interaction state; no previous_interaction_id | Persistent conversation requires new privacy/storage design |
| Separate chat contract and source consent | Preserve finite demo compatibility and newly approved scope | Merely renaming the demo would not implement free text |
| Shared transport budget | Prevent doubled daily/concurrency limits across endpoints | Independent limiter factories can bypass intended budget |
| Exact citations + honest limitations | Schema alone does not establish grounding or correctness | Returning unchecked output risks fabricated sources |

Official references checked: [getting started](https://aistudio.google.com/docs/get-started), [structured output](https://aistudio.google.com/docs/structured-output), [retention](https://aistudio.google.com/docs/interactions-overview#data-storage-retention), [pricing](https://aistudio.google.com/docs/pricing#gemini-3.8-flash), [unpaid terms](https://aistudio.google.com/docs/terms#data-use-unpaid). Free inputs/outputs may be reviewed/used for improvement; do not submit confidential, sensitive or personal information. store:false does not override those terms. API key presence cannot verify disabled billing.

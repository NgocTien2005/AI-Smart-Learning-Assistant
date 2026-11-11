# Implementation Plan: Study quality evaluation

## Summary / Technical Context

Node24+ existing pure local utils and cloud request/output/source validators.
DocumentAssistantPanel→API→course lesson authorization→resolveLessonSource→local
lookup; cloud panel→finite request→current access/original proof→bounded Gemini
transport→output validation→post-response access/source checks. No new API/schema.

## Constitution Check

I response contracts/source resolution preserved; II auth/access guards unchanged;
III no UI; IV red→green fixture tests and explicit evidence classes; V no private
egress/provider/DB writes. Pre/post-design PASS, no exceptions.

## Project Structure and decisions

- backend/src/utils/studyAssistant.js: lowercase before Đ conversion; passage
  token Set membership instead of substring includes; stable scoring/order/top3.
- backend/src/services/demoCloudAssistant.js: normalized NFC/whitespace option
  and question uniqueness, preserving case-sensitive identifiers.
- backend/test/fixtures/study-evaluation.json: original fixed synthetic cases.
- backend/scripts/evaluate-study.mjs: offline runner, safe case-ID summary/exit.
- backend/test/studyEvaluation.test.js: same cases in ordinary Node tests.
- docs/ai-evaluation.md: four capabilities, runner, limits/manual model rubric.

## Phases, risks and verification

Write cases first, demonstrate substring/Đ and equivalent-output defects, apply
small algorithm/validator changes, rerun full backend/quiz and isolated HTTP/DB
because lookup behavior changes. No frontend rerun/browser for backend-only.
Existing provider contract/timeout/privacy tests retained. Offline runner imports
fixed fixtures only and never calls createCloudService.generate or real fetch.
No provider model/API changes or configuration reads. Actual model evaluation
not claimed;012T012 retains all four-action operator gate.

## Complexity Tracking

No vector store, embeddings, framework or model download. Exact-token retrieval
is a documented local improvement, not LLM intelligence.

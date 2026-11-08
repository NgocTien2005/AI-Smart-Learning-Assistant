# Implementation Plan: Grounded demo cloud assistant
**Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

## Summary
Add a separate optional cloud panel to the existing lesson reading view. Server verifies current authentication, course access and exact original demo source before any provider request. Gemini free-only operator configuration; no arbitrary text, uploads, history, tools or paid fallback. Actual provider acceptance remains pending private key setup.

## Technical Context
JavaScript/Node24+/Express5/Prisma7/React19, existing fetch/crypto and dependencies only. No schema/migration/dependency change in012. Existing DemoSeedDataset registry from011 proves IDs; reconstructed original source proves content. Test Node router/service regression, frontend Vitest/lint/build, isolated HTTP/DB with provider disabled, real Chrome1280x800/1440x900. Max source10000chars, response128KiB, output3072tokens, timeout30s, one in-flight request globally,20requests per UTC day per process and20s per-user cooldown. Single-process development/demo only; multi-instance durable quota is outside this scope. Budget0 requires operator use unbilled free-tier project; app cannot inspect provider billing.

## Constitution Check
I: additive documented API/consumer, production app only; II: current auth and per-resource owner/enrollment before provider, no admin bypass; III: explicit action and separate panel with honest scope/unavailable states, no session/quiz changes; IV: distinguish controlled tests from actual model acceptance; V: no secrets/evidence/real documents egress, no new dependencies, no destructive data operations. Pre/post design gates pass with these constraints.

## Project Structure
- backend/src/services/demoCloudAssistant.js: pure original-source catalog, strict response validation, fixed provider transport and ephemeral limits.
- backend/src/routes/demoCloudAssistant.js: injectable production router, authentication/access/proof, strict finite payload, safe errors; mounted from backend/src/app.js at /api/courses.
- frontend/src/components/DemoCloudAssistantPanel.jsx: finite Q&A question selector and four actions, citations/quiz explanation, distinct error/loading/no config; key by lesson+session.
- frontend/src/pages/CourseWorkspacePage.jsx: add panel beneath existing selected lesson content, retain local assistant/summary/quiz.
- backend/test/demoCloudAssistant.test.js and frontend/src/__tests__/DemoCloudAssistantPanel.test.jsx.
- docs/demo-cloud-ai.md, compose.dev.yaml private optional key plumbing only, .env.docker.example empty placeholders. No cloud key in Vite/production compose/acceptance.

## Phase 0: Research
Official current Gemini docs support Gemini3.8Flash free input/output, Interactions API revision2026-05-20, structured JSON response_format, store:false. No SDK install needed; direct fetch. Old2.5Flash has changed/deprecated; no auto-routing/old model default. Check completed steps model matches pinned model before accepting response. No model chain/tool/search calls. Read official pages before implementation; see research.md.

## Phase 1: Design and contract
1. Read paths UI selected lesson -> apiRequest -> new router -> authenticate/current DB user -> course owner/enrollment -> registry proof -> exact original-source reconstruction -> fixed external endpoint -> validate citations -> response.
2. GET lesson cloud capability returns enabled/eligible/model/scope and safe code. It performs no external request. POST validates numeric ID and exact finite body before database/provider. Permission failures404/403, no config503, disallowed source403, invalid body400, busy/limits429, provider unavailable502/timeout504. No provider error body or key to client/log.
3. Original source comparison uses original dataset module and document processing of committed synthetic material; source text from current database must exactly match reconstructed approved source, including document hash/file ownership when present. Modified source/title is denied. Never send current user/course metadata, history, credentials, real document or client text. Fixed question/action strings only.
4. Provider sends system instruction + JSON source chunks with stable S1... IDs, fixed requested action, store:false, no tools/history/automatic retry. Bound response streaming before JSON parse; require completed model_output/text, matching model, schema and excerpts present in exact source. Insufficient response explicit; reject citations if unknown/empty/fabricated. Citation checks do not prove all generated reasoning correct; UI says review against source.
5. Daily global limit20, active1, user cooldown20s; failures consume attempt budget, no retry. Map stores at most20unique users/day. Abort provider on timeout and request cancellation where possible; output discarded after lesson/session change. No response persistence or provider raw logging.
6. UI labels external Gemini demo scope/free data terms, no arbitrary question field, no key entry in app. Four explicit actions with finite demo Q&A choices. Controlled quiz questions remain separate study suggestions, no local attempt writes. Accessible alert/status, source blockquotes and lesson link; React escapes output.
7. Tests cover guards before provider, modified/non-demo sources, all four actions via controlled provider, malformed/oversized/safety/timeout429 output, invalid quote/model, limits and no fallback. Integration actual DB/HTTP exercises disabled configuration + denials with zero provider requests. Actual configured generation is optional private operator acceptance, four explicit actions; preserve pending task until observed.

## Complexity Tracking
No constitution exception. Source reconstruction is deliberate protection of narrow user consent. Finite demo questions deliberately exclude accidental private text. No guarantee about billing when operator uses a paid project; refuse without free-only attestation and document limitation.

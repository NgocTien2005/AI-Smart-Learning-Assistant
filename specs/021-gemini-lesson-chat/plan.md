# Implementation Plan: Gemini lesson chat

**Branch**: `feat/gemini-lesson-chat` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

## Summary

Add a separate authenticated `/chat` contract and React conversation panel in the existing lesson workspace. Reuse the pinned Gemini transport and exact citation validator with a free-text adapter and shared process budget. Keep the finite `/cloud-assistant` contract and demo proof unchanged. No schema, dependency, lockfile, billing or authentication architecture changes.

## Technical Context

- Language/platform: existing JavaScript ES modules, Node24+ backend, React19/Vite8 frontend, Docker Linux/PostgreSQL17.
- Dependencies: existing Express5, Prisma7, React Router7; native fetch/AbortController/crypto. Storage: browser component memory only; Prisma read-only lesson/user queries.
- Testing: Node production-router injection tests, Vitest/RTL, full package gates, quiz regression, isolated HTTP/database integration, actual Chrome at1280×800/1440×900.
- Constraints: key stays server-side; operator confirms billing disabled; explicit `GEMINI_CHAT_ALLOWED=true` flag and per-view source/consent. No provider calls during CI; real acceptance separately gated on readiness.
- Scale: one source ≤12k chars, question≤2k, six untrusted alternating history turns≤6k each, output≤6k/eight quotes,30s/128KiB provider response,20calls/day/process,20s/user cooldown,one active shared across demo/chat.

## Constitution Check

Before research: all five principles satisfied by preserving real production routing, owner/enrollment, recoverable UI, evidence separation and no database writes. After design: same PASS; data-egress scope explicitly clarified by user on2026-11-12, disclosure excludes confidential/personal material under Free terms. No exception or constitution change.

## Phase 0 research

Research agent confirmed current official Google docs (see research.md). Runtime boolean probe reports key=false,free=false; no API call attempted. Actual baseline: clean1182dad onfix/vite-auth-runtime; official resolver008 before official allocator created021. New branch depends on main9b35d7e plus1182dad documentation; intended PR base main, outstanding PR15 only overlaps documentation.

## Phase 1 design

Trace: CourseWorkspacePage → GeminiChatPanel → services/api → production src/app.js → lessonChat router → authenticate/current Prisma user → lesson source resolver → shared Gemini transport → validated result → final access/session/source recheck → text-only React chat/citations.

Backend modules: `services/lessonChat.js` strict validation/source excerpting, `routes/lessonChat.js` authorization/status/errors; minimal extension to demoCloudAssistant service for shared budget/free-text adapter. Mount both with one shared budget in src/app.js. Preserve backend/app.js legacy unchanged.

UI: replace workspace entry label with Chat Gemini, retain existing visual identity/panel layout. Header+source selection+sharing acknowledgment, scrollable text conversation, question textarea, Send/Cancel/Clear. Source kind/title/truncation disclosed; default unselected and unchecked. Form retained on failure. Memory/consent reset via lesson/revision/session key; abort pending work and ignore stale session responses. No Markdown HTML rendering, streaming, persistence or automatic retry. Keyboard labels/Tab/native form submission, live pending/error messages. Existing quiz leave guard untouched.

Private setup: new `scripts/start-gemini-chat.ps1` uses separate hidden-input PowerShell console and source-scope/Free confirmation; reuse verified target/Docker bridge with chat enablement explicitly passed. No key readback, config dump, file persistence or provider calls. Existing demo launcher keeps synthetic scope. Docs explain recreate/reconfigure and Free terms. Rebuild only verified default backend when old key absent; never touch8081 or volumes.

See [data-model](data-model.md), [HTTP contract](contracts/chat.md), [quickstart](quickstart.md).

## Project Structure

`backend/src/{routes/lessonChat.js,services/lessonChat.js,services/demoCloudAssistant.js,app.js}`; `backend/test/lessonChat.test.js`; `frontend/src/components/GeminiChatPanel.{jsx,css}`; `frontend/src/__tests__/GeminiChatPanel.test.jsx`; workspace page; Compose dev/acceptance configuration; private launcher/docs; feature021 artifacts and safe evidence.

## Verification and risk

Cross-course leakage and delayed revocation are highest risk: deny before model, recheck after, compare source fingerprint/title/revision. Source/history prompt injection has no executable tools and cannot expand fetched data; exact quotations do not guarantee semantic truth, so user review remains mandatory. Free services are unsuitable for confidential/personal data. Shared in-memory budget is local-only and resets with process; not a multi-node abuse/billing guarantee. Run controlled transport tests without real egress, full frontend/backend gates, isolated integration and actual browser layout. Real two-question acceptance stays open if runtime key/Free confirmation missing.

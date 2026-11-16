# Reproducible three-role demo

Use only a verified development/demo environment and synthetic data. This script
is a presenter guide, not permission to reset a DB, send emails, invoke a provider
or delete data. Read [dataset instructions](demo-data.md) first. Never target
local8081 or an unknown/production database.

## Preparation

1. Use a reviewed feature revision or the explicit
   [portfolio integration reference](integration-review.md). Detailed setup is in
   [README](../README.md). Node24+, Docker Desktop and private local `.env` are
   prerequisites. Do not recreate an already privately configured backend merely
   to show a different frontend branch; that can remove runtime-only Gemini keys.
2. Confirm the exact Compose project, published HTTP origin and backend database
   identity with the guarded seed preview. If the existing development dataset
   reports `unchanged`, preserve it. The official private-console launcher creates
   credentials once; it does not reset passwords on rerun. Obtain already-issued
   credentials privately, never from logs, source or chat. Do not reset real users.
3. Prepare separate private browser sessions for an owning instructor, enrolled
   student and demo admin. Keep another instructor and a non-enrolled student
   available for access-denial demonstrations. The ledger contains18synthetic
   users,8courses,48lessons,26documents and24assignments; no outbound mail is sent.
4. Start at `http://localhost:8080`, or Vite5173 through its configured API proxy.
   Check health and an authenticated `/me` through the app. A health200 alone
   does not establish database or authorization readiness.

## Instructor

- Sign in with email/password. Open one of this instructor's courses and show
  its description, invitation code, lessons and roster. Another instructor does
  not own this course and cannot use its management/grading operations.
- Open a substantial Vietnamese lesson and a PDF/text document. Preview/download
  uses protected requests; explain PDF text-layer extraction, not OCR.
- Show an assignment with due date/points and its submitted/ungraded state.
  Later return to grade the demo student's submission with feedback. Keep any
  demonstration edits confined to synthetic resources and note changed data.
- Optionally create a clearly labeled synthetic course/lesson in a separately
  authorized disposable demo target; the seeded content already supports a
  read-only presentation without rewriting the ownership registry.

## Student

- Sign in as the enrolled student, open the course and show URL-backed section/
  lesson navigation, progress and document download. The default explorer student
  is enrolled broadly; use the other non-enrolled student to demonstrate a genuine
  access boundary. Admin status does not grant access to all lessons.
- Ask a supported local lookup question, view the source passage and extractive
  summary. Explain what happens when context is insufficient. Do not call these
  outputs an LLM response.
- Open a quiz draft, select an answer, leave through the app's explicit save/
  discard decision, then resume and submit. Explain snapshot/version and final
  server grading; browser unload only warns. Seeded completed attempts can be
  shown without creating new work if a read-only demo is preferred.
- Submit a synthetic response to an ungraded assignment if mutations are
  appropriate for this demo target. Return as its owning instructor to grade;
  return as student to see score/feedback. Existing seeded graded/ungraded
  examples also show both states without changing data.

## Administrator

- Sign in as demo admin. Search synthetic users and explain role/active flags.
  Inspect the deliberately disabled student; a disabled account cannot sign in.
- Demonstrate actual disable/role changes only on a designated disposable
  synthetic target and account, preserving its previous values. Otherwise show
  the UI and corresponding authorization tests without pretending a mutation ran.
- Explain that admin account management is distinct from course ownership and
  that public registration cannot create an admin.

## Optional provider and recovery segments

Google OAuth is retired by feature022. Demonstrate email/password; no provider
account linking or Client ID is required. Existing user data is preserved.

For actual Gemini conversation follow [private chat setup](gemini-chat.md),
billing disabled. Select an authorized synthetic lesson, acknowledge sharing,
ask a free question, expand citations and ask a follow-up after20seconds.
Two actual3.1Flash-Lite UI turns with validated quotations were accepted2026-11-16.
No key enters frontend/chat. Free quota/provider errors remain possible; no mock
or automatic retry. The old finite demo has separate historical acceptance.

Historical real email/reset acceptance belongs to008T023 and remains recorded.
Do not reuse its old send budget or `.invalid` demo emails for another send.
New mailbox, recipient and permission/budget require a separate explicit setup.

## Close the demonstration

Show exact local/hosted evidence in the [report](portfolio-improvement-report.md).
The combined acceptance included real Chrome role views at1280×800/1440×900,
plus390/768 layouts, and actual HTTP/database/files. Browser role views do not
claim every grading/quiz mutation was clicked; those workflows have component
and integration evidence. No screenshots or model success are invented.

Leave existing data/volumes intact. Record any synthetic edits; cleanup is a
separate scoped action, never `down -v` or an email-prefix delete. Existing
policy-blocked browser profiles remain untouched. This is not a public release.

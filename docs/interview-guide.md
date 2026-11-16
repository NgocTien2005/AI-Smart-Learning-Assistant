# Interview guide

Use [the overview](portfolio-overview.md) for a short introduction and the
[demo script](demo-script.md) for an actual walkthrough. Describe evidence and
limits before making reliability or security claims.

## Opening explanation

“Lumina is a Vietnamese LMS with instructor-owned courses, enrolled student
workflows and account administration. I focused on preserving contracts while
improving production-code tests, authorization, async UI behavior and isolated
integration. Its default study tools run locally; an optional cloud demo is
restricted to original synthetic data.”

Do not describe it as deployed, production-ready or as a general document LLM.
The [report](portfolio-improvement-report.md) identifies real observed results.

## Decisions to explain with code

| Topic | Decision and reason | Tradeoff / next step |
| --- | --- | --- |
| Boundaries | Extract focused routers/services/hooks from large modules, retain handler behavior | Avoided a speculative repository/controller framework |
| Authorization | Current DB user plus owner/enrollment checks for every protected operation | More reads; do not trust role/course IDs from the browser |
| JWT sessions | Existing Bearer architecture retained; authVersion revokes old sessions | Browser storage remains exposed to XSS; cookie migration needs CSRF and compatibility work |
| Abuse controls | Bounded expiring process-local windows, no new dependency | Shared proxy IPs and multi-instance limits need topology/shared-state planning |
| Quiz persistence | Snapshot questions, debounced drafts, optimistic version checks, authoritative submit | Browser unload cannot promise delivery; conflicts require explicit recovery |
| Password reset | Generic forgot response, hashed expiring token and atomic one-use update | SMTP acceptance is not mailbox delivery; real evidence is separate |
| Authentication | Email/password; OAuth removed by feature022 | Users and immutable historical migrations preserved; no automatic provider merge |
| Uploads | Protected download and bounded extension/MIME/content/text extraction checks | PDF text layer only; no OCR, antivirus or arbitrary document understanding claim |
| AI grounding | Source excerpts/structured output checks and original-demo ownership validation | Structural grounding does not prove semantic entailment or defeat every injection |
| Testing | Actual components/production routers plus real isolated HTTP/DB/files | Mocked provider contracts do not prove actual provider quality |
| Recovery | Synthetic dump/restore and upload digest rehearsal | Not proof of live-data consistency or agreed RPO/RTO |

Source walkthroughs: [architecture](architecture.md),
[module boundaries](module-boundaries.md), [security](security.md),
[AI evaluation](ai-evaluation.md), [operations](operations.md).

## Questions worth practicing

1. Why is a valid JWT insufficient when an account has been disabled or its role
   changed? Show current-user lookup and authVersion checks.
2. How do you prevent one instructor from grading another instructor's course?
   Show the object-level predicate and negative integration cases.
3. What if two quiz drafts or two password resets submit concurrently? Explain
   version checks versus conditional atomic update and their different contracts.
4. How does the client distinguish a terminal401 from an intermittent server
   failure? Show recoverable session states and stale-request generation checks.
5. Why does opening a used reset link still render a form? Explain server POST
   enforcement and validation400 versus invalid/expired/used-link400.
6. How do file/database operations fail partially? Explain source revisions,
   synthetic seed ownership, possible orphan reporting and scoped cleanup.
7. What did AI evaluation actually prove? Give the reproduced Đ normalization,
   substring-token and duplicate-output cases; distinguish offline21-case checks
   from unperformed real Gemini quality acceptance.
8. How does CI know which database it is testing? Show project/network/volume/
   port checks and backend Prisma query identity, not merely TEST_API_URL.
9. Why not enable trust proxy or convert to cookie sessions immediately? Explain
   spoofing/topology and migration/CSRF impacts rather than claiming defaults
   solve every deployment.
10. How would you scale it? Identify single-process challenge/rate/quota state,
    file storage and backup coordination as planned work, not implemented scale.

## Evidence language

Say “this exact commit passed these three hosted jobs” with a link. Say “the
browser observed this role/view/viewport” separately from endpoint tests. Say
“contract tests reject this synthetic output,” rather than “the model is safe.”
If asked about production, point to the remaining TLS, secrets, least privilege,
monitoring, restore objectives and provider gates in the readiness checklist.

No invented throughput numbers, screenshots, users, deployment URLs, paid API
usage or guaranteed model correctness belong in the presentation.

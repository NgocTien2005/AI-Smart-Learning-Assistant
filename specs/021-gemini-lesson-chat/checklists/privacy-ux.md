# Privacy and UX requirements checklist: Gemini chat

Purpose: reviewer requirements-quality gate. Created2026-11-12. Feature:[spec](../spec.md).
Ownership: reviewer-owned; [x] approves requirement clarity, not implementation. Implement reads markers only.

## Completeness and consistency

- [x] CHK001 Is authorized, selected source scope and disclosure explicit? [Spec FR002–003]
- [x] CHK002 Are question/history/source/output bounds and error recovery measurable? [Spec FR005–007]
- [x] CHK003 Are pre/post authorization and late-session/source handling unambiguous? [Spec FR003, US2]
- [x] CHK004 Are Free billing limitations, provider data use and no fallback defined? [Spec FR004–006, Assumptions]
- [x] CHK005 Are keyboard, memory reset and desktop acceptance defined? [Spec FR007, SC004]
- [x] CHK006 Are finite-demo/local tools compatibility and actual-provider evidence separate? [Spec FR008, SC001]

## Notes

Generated unchecked. Review separately under user's prior authorization, then freeze markers for implement.

Review 2026-11-12: CHK001-006 satisfied by cited FR/US/SC and contracts; user authorized requirements review. Frozen before implement.
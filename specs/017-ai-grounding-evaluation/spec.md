# Feature Specification: Reproducible grounded-study evaluation

**Feature Branch**: feat/ai-quality-improvements
**Created**: 2026-11-09
**Status**: Reviewed
**Input**: Portfolio D, AUD09; honest local/cloud distinctions.

## Problem, goals and non-goals

Maintainers need reproducible source-grounding examples instead of calling local
lookup/extraction/templates an LLM. Improve demonstrated lexical matching and
structured quiz uniqueness errors with a small original synthetic evaluation set.
No new provider/model, real-user egress, paid billing, free-text cloud scope,
OCR, API/schema/dependency change or fabricated model acceptance.

## User Scenarios & Testing

### User Story 1 - Receive relevant local source passages (Priority: P1)

As a learner I need keyword matches consistent across Vietnamese casing, without
matching a technical term solely inside an unrelated word.
**Independent Test**: Original synthetic positive/negative lookup cases.
**Acceptance Scenarios**:
1. Given accented Vietnamese text, when question casing changes including Đ/đ,
   then the same relevant passage is retrieved.
2. Given only an unrelated substring, when queried, then lookup reports no
   matching passage; empty or absent evidence never becomes an invented answer.

### User Story 2 - Trust source/output checks and their limits (Priority: P1)

As a maintainer I can run offline study evaluation and identify what is not
real-model evidence.
**Independent Test**: Versioned fixture runner with safe summary, no network/key.
**Acceptance Scenarios**:
1. Given source-backed local summary/template quiz, when evaluated, then all
   reported passages originate in the supplied source and unsupported input fails honestly.
2. Given fabricated citations, equivalent duplicate options or repeated cloud
   questions, when validated, then output is rejected; valid structured output
   and explicit insufficient-context responses remain supported.
3. Given modified/instruction-bearing source, when cloud eligibility is checked,
   then original-demo proof refuses it before provider access.

### Edge Cases

Unicode canonical equivalence, whitespace-only option differences, repeated
questions, source ID mismatch, insufficient context, unsupported template input,
provider errors/timeouts/limits, stale source/session and injection text.

## Requirements

- **FR-001**: Local lookup MUST normalize Vietnamese casing/accents consistently and match complete normalized tokens, preserving stable top-three passage ranking.
- **FR-002**: Cloud quiz validation MUST reject options/questions equivalent after Unicode NFC and whitespace normalization; preserve case-sensitive distinctions and existing citation/bounds checks.
- **FR-003**: Provide at least12 original synthetic reproducible cases covering positive/negative lookup, extractive summary, template quiz, structured cloud output and modified-source refusal.
- **FR-004**: Offline evaluation MUST make zero network/provider/database requests and return nonzero on a failed case; safe summary identifies local/contract evidence without claiming model factual quality.
- **FR-005**: Preserve server authorization/original-demo privacy proof, bounded provider operation and historical012T012 real-model gate; no paid/private egress.

### Non-functional and security requirements

No new dependency, schema, API response shape or frontend change. Fixed synthetic
fixtures only; no private request logging. Citation substring validity is not
semantic entailment or a guarantee against hallucination. Model quality remains
a separate human-reviewed evaluation after operator configuration/consent.

### Key Entities

Evaluation case: stable ID, capability class, synthetic source/input, expected
outcome. Run summary: ID/class/pass, counts, zero-network indicator, exit code.

## Success Criteria

- **SC-001**: At least12 deterministic cases pass and reproduced Unicode/substring/duplicate-output defects become regression-protected.
- **SC-002**: Backend/full quiz/CI checks pass; evaluation is included in ordinary backend test discovery without provider credentials.
- **SC-003**: Documentation clearly separates all four capabilities and real model acceptance remains explicitly unverified unless actual results exist.

## Clarifications

2026-11-09: scope/privacy/provider decisions already explicit. Budget0 and only
synthetic demo sources persist. No new question required; no automatic provider
call is necessary for deterministic improvements. Real012T012 remains open.

## Known constraints

Token retrieval cannot understand paraphrases or general questions. Exact quotes
do not validate factual claims; small fixture set is not a comprehensive benchmark.
Independent audit-base branch, no security/refactor/test branch silently stacked.

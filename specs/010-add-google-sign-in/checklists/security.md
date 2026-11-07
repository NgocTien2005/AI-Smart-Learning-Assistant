# Requirements Checklist: Google ownership and operation

**Purpose**: Reviewer-owned requirements quality gate, not implementation certification.
**Created**: 2026-11-07
**Feature**: [spec.md](../spec.md)

`[x]` means reviewer approval of requirements quality. Implement reads markers only.

## Completeness and consistency

- [x] CHK001 Are existing-account-only and no automatic email linking requirements explicit and consistent? [Completeness, Spec FR-001, US2]
- [x] CHK002 Are owner authentication, matching verified email and link uniqueness/replacement rules specified? [Clarity, Spec FR-002, US1]
- [x] CHK003 Are signature, recipient, issuer, expiry, browser binding, single use and bounded lifetime required? [Coverage, Spec FR-003]
- [x] CHK004 Are current role/active/revocation and all three role outcomes defined? [Consistency, Spec FR-004, SC-001]
- [x] CHK005 Are password/registration/reset invariants explicit? [Completeness, Spec FR-005]

## Recovery and evidence

- [x] CHK006 Are stale callbacks, uncertain mutation outcomes and read-only recovery defined? [Coverage, Spec FR-006, Edge Cases]
- [x] CHK007 Are desktop size, layout and accessible optional-provider states measurable? [Measurability, Spec FR-007, SC-003]
- [x] CHK008 Are secret/privacy boundaries and missing provider configuration covered? [Coverage, Spec FR-008/009, US3]
- [x] CHK009 Are fixture, real database, hosted CI and actual provider acceptance distinguished? [Clarity, Spec FR-010, SC-004]
- [x] CHK010 Are dev target/origin and protected existing-resource constraints stated? [Consistency, Spec FR-011, Assumptions]

## Notes

Generated unchecked. Separate authorized review records evidence before implement; checklist markers are read-only during implement.

Separate authorized review, 2026-11-07: 10/10 requirements-quality items pass. CHK001–005 cite explicit FR-001–005 and US1/US2 constraints; CHK006 cites FR-006 and uncertain/stale Edge Cases; CHK007 cites FR-007/SC-003 measurable sizes; CHK008 cites FR-008/009 plus US3 private setup; CHK009 cites FR-010/SC-004 evidence boundaries; CHK010 cites FR-011 and protected target assumptions. This is reviewer assistance authorized by the user, before implement, not runtime certification. No marker changes during implement.

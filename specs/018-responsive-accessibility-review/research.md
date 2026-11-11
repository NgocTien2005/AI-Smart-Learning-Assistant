# Research

Decision: narrow one-column auth at760px, preserve desktop two-column shell.
Rationale: actual390px input37.828px, visually clipped letters;768px input244.156px
remains usable and desktop410px intact. No-overflow metric alone hid the defect.
Alternative shrinking font/padding in two tiny columns rejected as unreadable.

Decision: honor reduced motion with scoped rules retaining status/focus. Existing
continuous spinner has no preference override; a requirements improvement, not
proof of a reported functional failure. No broad UI redesign or unconfirmed
Escape callback change.

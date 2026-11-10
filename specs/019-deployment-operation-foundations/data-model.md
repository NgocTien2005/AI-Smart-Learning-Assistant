# Temporary recovery fixture

No application schema/model/migration changes. The fresh acceptance DB gets an operations-only fixture table with one synthetic value; a new lumina_restore_<hex> DB contains its restored copy and existing empty LMS schema/migration history. A synthetic upload fixture and same-invocation archive are compared by digest. Restore DB and named volumes remain reported; container /tmp archives disappear with owned containers. No real user data or external archive is accepted.

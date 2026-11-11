# Data model

No Prisma/schema/migration change. Existing User/isActive/authVersion/password reset
fields remain authoritative. Ephemeral bucket has hashed key/count/expiresAt;
maximum10000entries per limiter, fixed-window expiry, capacity fail closed.
No emails/passwords/tokens in bucket keys or persistent data.

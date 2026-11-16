# OAuth retirement contract

POST /api/auth/google/challenge, POST /api/auth/google/login, GET/POST /api/auth/google/link ->404 through existing app not-found handler. No challenge cookies, token exchange, SDK load, subject lookup or update. Authenticated callers receive same404; existing email/password token endpoints and public user shape unchanged.

No database/schema change. Legacy nullable googleSubject remains private/unused; existing users retain password/recovery. Gemini POST gemini-chat and Gmail forgot/reset contracts unchanged. Old clients must reload/update.

# Deployment configuration contract

Input: base compose.yaml + compose.web.yaml, Compose>=2.24.4, Docker>=28, explicit project/env file. Required POSTGRES_PASSWORD,JWT_SECRET,LUMINA_DOMAIN. Optional Gemini/SMTP values server only. Domain is public DNS host without scheme/path; operator verifies actual DNS and HTTPS.
Output: only frontend127.0.0.1:18080 published; backend/db internal; APP_ORIGIN/CORS=https://domain; demo false, no seed. No app HTTP/schema changes. Configuration validation never starts containers, contacts provider or prints secret values. Documentation commands run by operator, not deployment authorization.

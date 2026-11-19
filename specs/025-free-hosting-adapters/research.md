# Research - 2026-11-18

Decision: Supabase Storage REST/native fetch with backend-only key, private bucket metadata validation, opaque generated object names; keep protected API and local fallback selection explicit. No public URLs or direct Supabase client authorization because Lumina JWT is independent.
Sources: https://supabase.com/docs/guides/storage/serving/downloads ; https://supabase.com/docs/guides/getting-started/api-keys ; https://supabase.com/docs/guides/storage/security/access-control ; https://raw.githubusercontent.com/supabase/storage-js/master/src/packages/StorageFileApi.ts
REST GET /bucket/:id, POST /object/:bucket/:key raw bytes x-upsert:false, GET /object/authenticated/:bucket/:key, DELETE /object/:bucket JSON prefixes exact key. sb_secret key in apikey only; legacy service_role JWT additionally Bearer. Require public===false, never list/delete bucket.

Decision: Brevo POST https://api.brevo.com/v3/smtp/email api-key header, verified sender, one textContent, no retry. Free300/day currently, sender approval may block; Gmail sender cannot authenticate domain and provider may rewrite it. Acceptance ID is not mailbox proof.
Sources: https://developers.brevo.com/docs/send-a-transactional-email ; https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan ; https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email ; https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication
Alternatives: Resend testing sender restricted to own mailbox without verified domain; not assume domain purchase. Gmail SMTP remains local but blocked on Render Free. No paid upgrade.

Deploy: Render Free Docker/static, Supabase PostgreSQL session pooler IPv4 port5432 (not transaction6543), private storage. Free Render no shell/one-off/preDeploy/disk, sleeps15min and blocksSMTP; startup migration exists, local verified admin bootstrap documented. Supabase Free may pause, quota/backup restrictions; prefer verified TLS and never disable validation.
Sources: https://render.com/docs/free ; https://render.com/docs/deploys ; https://render.com/docs/deploy-vite ; https://supabase.com/docs/guides/database/prisma ; https://supabase.com/docs/guides/database/connecting-to-postgres

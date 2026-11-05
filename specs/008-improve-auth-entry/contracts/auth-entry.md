# Existing production auth contract (preserved)
Source: backend/src/routes/auth.js, middleware/authenticate.js, services/email.js, Prisma User; backend/src/app.js mounts /api. backend/app.js is legacy.
| Endpoint | Request / response | Failures |
| --- | --- | --- |
| POST /api/auth/register | trimmed name2–80, normalized email, raw password6–72, STUDENT/INSTRUCTOR;201 public user/token |400 validation,409 duplicate,500 internal |
| POST /api/auth/login | normalized email, raw password6–72;200 public user/token |400 validation,401 INVALID_CREDENTIALS including inactive,500 internal |
| GET /api/auth/me | bearer;200 current public user |401 AUTH_REQUIRED/SESSION_INVALID; network/5xx recoverable |
| POST /api/auth/forgot-password | normalized email;200 generic regardless of existence/delivery |400 email,503 SMTP config,429 per-IP+email5/15min,500 internal |
| POST /api/auth/reset-password |64hex token, raw password6–72;200 confirmation and old-session revocation |400 combined validation or precise invalid/expired/used link;500 internal |
Email uses existing no-whitespace/no-extra-@ local/domain and dotted domain regex after trim/lowercase; no254 limit. Confirmation frontend-only exact equality; never trim passwords.
Reset400 general: “Liên kết không hợp lệ hoặc mật khẩu phải từ 6 đến 72 ký tự” — preserve usability.
Reset400 explicit: “Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn” — request new link.
Unknown400 remains operation error, no invented machine code.
Forgot generic: “Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.” Not proof of delivery/existence; no Retry-After contract. Gmail transport only, no new sink.
Public user excludes password/reset hash. /me, active/authVersion and existing expiry remain authoritative; wrong credentials do not expire a newer session. Entry response role alone cannot route.
URLs unchanged: /auth, /auth?mode=forgot, /reset-password with existing secret query; registration local. Safe return rejects auth/reset including trailing slash; never record reset query values.

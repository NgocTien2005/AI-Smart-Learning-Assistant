# Existing production contract — unchanged

## Trace
frontend/src/app/App.jsx ADMIN route→AppLayout/AdminPage→services/api.js→backend/server.js imports src/app.js→/api/admin→routes/admin.js→authenticate.js/authorizeRole.js→Prisma User/Course/Enrollment.
No API/backend/schema changes. backend/app.js is legacy auth harness only.

## Read
GET /api/admin/users?q=...&page=...
q string trim and first120 chars, case-insensitive name/email contains; no role/status filters. Page integer1..100000, default1; fixed pageSize25. Managed roles INSTRUCTOR/STUDENT only; ordercreatedAt desc,id desc.
200 {users,page,pageSize,total,totalPages}; totalPages may0. Each row id/name/email/role/isActive/createdAt/_count{courses,enrollments,submissions}. Missing counts displayed unavailable,0 valid.
400 invalidpage; authenticate401 AUTH_REQUIRED/SESSION_INVALID; authorizeRole403; unexpected500 JSON{error}. No individual GET endpoint added.

Role/status-only changes do not alter name/email query membership or createdAt/id ordering. There is no supported role/status filter to make those changes hide an account. The filtered-out/page-clamp scenarios apply to renaming or authoritative/concurrent result changes; do not invent filters merely to manufacture removal.

## Write
PATCH /api/admin/users/:userId JSON optional name/role/isActive.
ID positiveinteger; currentADMIN self403; missing target/ADMIN target404.
Name string trim2–80 JScharacters. Role INSTRUCTOR/STUDENT; changing instructor with owned courses or student with enrollments409. isActive boolean; unchanged active alone yields400 no valid change.
Role/active changes incrementauthVersion; status disabling blocks login/current sessions. Name-only change doesn't revoke sessions. No email edit/create/delete/bulk/reset-password capability.
200 {user:{id,name,email,role,isActive}}, no counts/date: merge public fields for existing row, preserve metadata until authoritative reload.
400 name/role/status/nochange/ID validation;409 linked records;404 target;403 self/role;401 explicitsession;500/network may have uncertain write outcome. Keep{error,code when supplied}; never infer no commit on lost response. No automatic mutation replay.

## Authorization / data
authenticate verifies JWT then current User id/name/email/role/authVersion/isActive; token role/cache alone grants nothing. authorizeRole ADMIN separately. ADMIN does not bypass course owner/enrollment. Public select excludes password/hash/reset fields. Prisma User relations and migration history unchanged; no last-ADMIN rule invented.

## UI contract
Profile draft{name,role} perID; toggle payload only{isActive}. Existing role/status ConfirmDialog; name save direct. q/page/selection/drafts in memory, no URL-backed admin state introduced. /api/auth/me remains identity verification; current401 shared expiry,403 blocks operations and offers existing identity refresh.

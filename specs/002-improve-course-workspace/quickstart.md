# Quickstart verification

Đây là hướng dẫn, không phải kết quả đạt. Đối chiếu spec/plan/contracts. Không seed/reset/delete dữ liệu, không đọc/in token/password.

## V01 — Baseline và automation

Baseline tại .artifacts/course-workspace-baseline gồm source copy/hashes/git diff trước002. Giữ001 và pending T021/T022/T024/T025 riêng. Frontend: npm test, npm run lint, npm run build. Test component mocked không chứng minh API/DB thật.

## V02 — Desktop/native

INSTRUCTOR và STUDENT ×1280×800/1440×900, zoom100%, đầu section lessons,≥1bài. Chụp mới/bounds tên khóa/search/item/reader heading/trigger; record browser/font đúng weight, no horizontal overflow. Lặp title120/lesson160/description4000/token/content dài. Test Tab/ShiftTab/Enter/Space/Escape, native dialog, no hidden focus. Scope regression dashboard/admin/account/auth và section overview/assignments/students/settings sau CSS loaded.

## V03 — Reading/URL

Tìm title/content case-insensitive, all/complete/incomplete; đúng tập+ordinal; selected bị filter loại vẫn đọc và có notice. Chọn/previous/next đầu/cuối; query section/lessonId/panel giữ refresh/back/forward/deep link. Không lessonId khác invalid ID và course rỗng/no-match/error. Deferred courseA/B không stale; missing progress không giả0.

## V04 — Form/File

Instructor defaultclosed; header CTA opens từ overview, heading toggle, focus/title và Escape return. Nhập title/content/order/File, collapse/reopen/switch section giữ draft/tên file; không request. Title normalized1/2/160/161, content100000/100001, orderempty/0/10000/-1/decimal/10001, filetype/size/content-or-file. Pending doubleactivation1write; close whilepending không hủy; server201 upsert1/collapse/clear file+draft/notice ngoài, 400/403/503/network retain. Move focus search then success không steal; default native disabled blur body trả trigger.

## V05 — Tools/progress/quiz

Authenticated preview/download text/PDF lỗi 401/403/404/network; lesson/resource switch không old content. Summary/assistant source/empty/error and quiz resume/draft/version unchanged. Integrated quiz leave new controls →flush, failurestay/discard, no premature URL change; browser unload không hứa write. Progress serialize same lesson, delayed response gắn id kể cả đổi selected, unmount không late notice.

## V06 — Live API/database

Kiểm tra Docker/8081/health hiện tại, không suy từ phiên trước. Chỉ dùng phiên và dữ liệu thử có sẵn được người dùng xác định; read-only trước, không tự provision/seed/reset/delete. Phân biệt liveness, DB readiness và resource endpoints. Integration script có register/provision/SQL cleanup nên không tự chạy nếu dữ liệu/dọn chưa được phép. Browser auth cần user đăng nhập, không đọc credential/token từ storage. Nếu không có session/resource phù hợp, hoàn thành component/static/fixture native độc lập và giữ live task unchecked.

## Traceability

| FR | US/AC | SC | Check |
| --- | --- | --- | --- |
| 001 | US4-AC4 | 006 | V01/V06 guards |
| 002 | US1-AC1,US4-AC1 | 001 | V02 bounds |
| 003 | US1-AC2/5 | 002 | V03 search/ordinal/states |
| 004 | US1-AC3 | 002 | V03 filtered selected |
| 005 | US1-AC4 | 002 | V03 URL/prevnext/invalid |
| 006 | US2-AC1,US3-AC5 | 001/004 | V02/V05 reader/actions |
| 007 | US2-AC2/3 | 004 | V05 preview/tools |
| 008 | US2-AC4 | 004 | V04/V05 capability |
| 009 | US3-AC1/2 | 003 | V04 disclosure/File |
| 010 | US3-AC3 | 003 | V04 validation |
| 011 | US3-AC4 | 003 | V04 pending/write |
| 012 | US1-AC5,US2-AC5 | 004 | V03/V05 states |
| 013 | US2-AC5,US4-AC3 | 004 | V03/V04/V05 races |
| 014 | US4-AC1/2 | 005 | V02 keyboard/long |
| 015 | US2-AC3 | 004 | V05 integrated quiz |
| 016 | US4-AC4 | 001/006 | V02 scoped CSS |
| 017 | US4-AC4 | 006 | V01/V06 diff/contract |

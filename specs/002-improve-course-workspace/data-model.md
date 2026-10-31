# Data model và state UI

Không thay persisted model/schema/migration. Existing schema/production route là authority.

| Entity | Fields / semantics |
| --- | --- |
| SessionUser | id/name/role qua /auth/me; role không thay ownership/enrollment |
| Course | id/title/description/instructor, lessons ordered order/createdAt, assignments, _count.enrollments; giữ snapshot |
| Lesson | id/courseId/title/content/order/documentName/extractionStatus/sourceRevision; STUDENT có isCompleted/completedAt |
| Reading location | section, lessonId, panel trong query; selected theo toàn khóa, filter chỉ ảnh hưởng list |
| Create draft | raw title/content/order, File hoặc null, fileError/field errors; page instance giữ, không persisted |
| UI request | mounted, read sequence/controller, per-operation ref locks/pending; notices giữ bên ngoài hidden form |

Validation: title trim2–160, content trim≤100000, order Number(raw) integer0–10000, raw empty=0; content hoặc file; file helper existing≤10MiB/type/extension. Raw không bị maxLength chặn trước trim. Response201.lesson upsert/sort; không thêm metadata giả. Missing progress có nhãn, course0lessons khác progress thiếu.

Transitions: closed↔open giữ draft/file/errors, không fetch; invalid giữ/focus; sending khóa fields/file/remove/submit, close còn dùng; confirmed success clear/reset file DOM/collapse/upsert1/notice; failure release và retain. Unmount bỏ UI work, không hứa cancel server write.

Course request mới invalidate/abort cũ; new course instance key theo router. File/native input không được gán path; state File dùng multipart dù DOM input remount. SourceRevision preview key khôi phục preview resource sạch; quiz keys/flush/version giữ nguyên.

# Kiểm tra CI của Lumina LMS

[Workflow](../.github/workflows/ci.yml) chạy trên `pull_request`, `push` và
`workflow_dispatch`. Ba job độc lập dùng Ubuntu 24.04, Node 24 và action chính
thức pin bằng full commit SHA. Token chỉ có `contents: read`; checkout không
lưu credentials. CI cơ bản không cần secret production, Gmail hay repository
secret. Trạng thái hosted run được ghi theo revision trong
[verification 009](../specs/009-setup-quality-ci/verification.md).

| Job | Lệnh bắt buộc / cwd |
| --- | --- |
| Frontend | `npm ci`, `npm test`, `npm run lint`, `npm run build` — `frontend/` |
| Backend | `npm ci`, `npm test`, `npm test -- --test-name-pattern=quiz` — `backend/`; thêm CI runner safety tests |
| HTTP/database integration | `npm ci` — `backend/`; build/start stack riêng, chờ healthy, đối chiếu HTTP/database, `npm run test:integration` — `backend/`, rồi shutdown đúng project |

Frontend tests gồm Node service tests và Vitest render component. Backend
`test/auth.test.js` dùng `backend/app.js` legacy; quiz regression dùng production
router với injection hẹp. Integration chạy HTTP/database qua `backend/server.js`
→ `backend/src/app.js`. Reset link trong suite là DB fixture, không chứng minh
nhận được email.

## Chạy lại trên máy

Yêu cầu Node 24+, npm, Docker Linux engine cục bộ và Compose hỗ trợ `--wait`.
Từ repository root:

```powershell
node scripts/ci/check-package.mjs frontend
node scripts/ci/check-package.mjs backend
node scripts/ci/check-package.mjs integration-deps
node scripts/ci/integration.mjs
```

Helper chạy đúng scripts/lockfiles hiện có. Install thất bại thì check phụ
thuộc được ghi `skipped`; test thất bại vẫn được giữ dù lint/build sau đó pass.
Summary ghi command, cwd, exit code và duration. Deadline/cancellation trả
nonzero. Không nâng dependency hoặc tạo workspace gốc. Backend dùng dotenv
trống và secret thử sinh lúc chạy. Với frontend host, dùng checkout kiểm thử
không có `.env*` riêng vì Vite tự đọc chúng; CI checkout và bản Linux được kiểm
chứng không chứa các file đó.

Integration tạo tên `lumina-acceptance-ci-<timestamp>-<random>` và chọn cổng
loopback đang trống. Có thể đặt `CI_TEST_PROJECT`/`CI_TEST_PORT` cho target mới;
helper từ chối tên/cổng không an toàn và project đã có container, network hoặc
volume. Không chạy lại project cũ với secret mới. Cổng 8080–8084 được bảo vệ,
bao gồm local8081. Docker endpoint phải cục bộ; conflicting overrides bị từ chối.

Helper dùng `compose.acceptance.yaml`, env-file trống và DB/JWT secret ngẫu
nhiên trong process. Trước provisioning, guard kiểm tra labels, health,
loopback binding, network/mount riêng, database và địa chỉ server mà Prisma
trong backend thực sự kết nối; sau đó kiểm tra `/api/health` và database mới
không có user. Chỉ đổi `TEST_API_URL` không vượt được guard.

Suite dọn tài khoản/tài nguyên thử của chính nó. Helper xác nhận
`remainingOwnedUsers: 0`, kiểm tra ownership rồi `compose down` đúng
file/project. Không dùng `-v`, `--remove-orphans`, reset/drop DB hoặc thao tác
local8081. Named volumes thử được giữ trên host để review, không tự tái sử
dụng/xóa. Hosted runner tạm thời kết thúc cùng tài nguyên của runner. Khi
startup/suite lỗi, finally vẫn thử shutdown; lỗi chính và cleanup giữ riêng.
Hard termination có thể ngắt finalizer; xem đúng project trong summary trước
khi cleanup thủ công.

## Evidence và xử lý lỗi

Job upload đúng các file sau với retention **7 ngày**, hidden files tắt và
thiếu summary là lỗi. Summary được giữ cả khi check thất bại:

- `ci-results/frontend/summary.json`
- `ci-results/backend/summary.json`
- `ci-results/integration-deps/summary.json`
- `ci-results/integration/summary.json` khi bước integration đã chạy
- `ci-results/integration/http.json` khi có evidence suite hợp lệ

Summary chỉ có revision/runtime, command/cwd/duration/exit, định danh target/
tài nguyên công khai và trạng thái verification/cleanup. HTTP evidence chỉ
có method, path thuộc danh sách endpoint cho phép (không query), status hoặc
loại lỗi giới hạn, resource kind/id và số user thử còn lại. Không export body,
header, email tài khoản thử, password/hash, token/reset URL, `.env`, browser
profile hoặc Docker environment. Không upload cả thư mục `ci-results`,
`.artifacts`, private suite records hay raw child output. Evidence cũ bị loại
trước integration mới để không nhầm lần chạy.

Khi command lỗi, summary giữ nonzero và tên command/cwd. Điều tra trên
checkout/stack thử mới; không thay full-suite failure bằng narrower pass hay
`continue-on-error`. Raw output chỉ tồn tại trong bộ nhớ helper, không ghi vào
artifact. Không dump resolved Compose config, Docker environment hoặc
authenticated requests để debug.

## Validate và hosted execution

Từ root:

```powershell
node --test scripts/ci/test/ci.test.mjs
docker run --rm -v "${PWD}:/repo:ro" -w /repo rhysd/actionlint:1.7.12 -color .github/workflows/ci.yml
```

Actionlint kiểm cú pháp/actions expressions; không chứng minh hosted pass.
Host Node 25, Linux Node 24, stack integration riêng và GitHub-hosted execution
là bằng chứng khác nhau. Xem [verification 009](../specs/009-setup-quality-ci/verification.md).

Sau khi được cho phép publish ở công việc khác, push revision và xem cả ba
job trong Actions; ghi run URL, SHA/event và outcomes trước khi đóng T018.
`workflow_dispatch` chỉ nhận event sau khi workflow có trên default branch.
Chưa push/run thì hosted acceptance vẫn mở. Required status checks/branch
protection là cấu hình repository riêng, chưa thay trong nhiệm vụ này.
Helper không commit/push/PR/merge/deploy.

## Email thật thuộc feature 008

T023 tiếp tục tại [verification 008](../specs/008-improve-auth-entry/verification.md).
Người dùng nhập SMTP credentials ngoài chat vào terminal riêng và xác nhận
hộp thư nhận được phép cùng budget tối đa 3 email. Chỉ probe readiness boolean,
không đọc/in secret hoặc Docker environment. Xác minh stack riêng trước mọi
write; không dùng tài khoản local thật.

Luồng cần bằng chứng: forgot qua UI → email thực sự đến → người dùng mở link
từ email riêng → reset → đăng nhập password mới → từ chối password/phiên cũ
→ từ chối link đã dùng. Người dùng thao tác hộp thư/URL nhạy cảm và chỉ báo
kết quả. Generic 200, SMTP accepted, mock và DB fixture không chứng minh
delivery. SMTP thật không chạy tự động trên PR. Thiếu điều kiện thì T023 mở
và CI vẫn chạy. T026 cùng các profile cleanup bị policy chặn giữ nguyên;
không thử xóa bằng cách khác.
# Feature-oriented coverage and evidence

Frontend component regression files now separate auth entry, sessions, dashboards,
course workspace, assignments, quiz lifecycle, document study, account settings
and administration. `frontend/src/__tests__/fixtures.js` shares synthetic helpers
and per-file cleanup; existing Google/cloud component files stay distinct.
The package's existing `vitest run src/__tests__` discovers all of them. No
assertion, parameterized variant, required command or workflow permission is
removed by the split. Vitest's default [file isolation](https://vitest.dev/config/isolate.html)
is retained; do not use `--no-isolate` as a shortcut for failing shared state.

| Gate | What it establishes | Limit |
| --- | --- | --- |
| Frontend npm test/lint/build | Real rendered components, navigation/late-response/draft behavior, static checks and build | Fetch fixtures do not prove DB/provider delivery |
| Backend npm test and quiz filter | Utilities and mounted production router tests, snapshot/version/concurrency and access rules | Old revisions' auth.test.js used legacy backend/app.js; production auth replacement is separate feature014 |
| Isolated integration | Actual production HTTP+database, roles/ownership, documents, progress, submission/grading and quiz workflows | Only the verified fresh target; health alone is liveness |
| Separate seed integration | Dry-run/collision/create-only/rerun guards, multi-owner dataset,247HTTP operations and disabled-cloud/source rejection | No SMTP/Google/Gemini request or mailbox/model acceptance |
| CI safety regressions | Target mismatch refusal, scoped cleanup, failure propagation, safe artifact export, cancellation | Not a public deployment security certification |

Exact source hashes/test-statement inventory and results for the split belong to
[feature016](../specs/016-production-test-organization/verification.md). Hosted
results must match the exact pushed SHA; a previous green badge does not certify
new code. No provider credentials or browser profiles should enter CI artifacts.


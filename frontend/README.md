# Lumina LMS frontend

React/Vite client for Lumina LMS, using the production `/api` contracts.

## Structure

- `src/app`: application shell and route composition.
- `src/pages`: page-level UI and page styles.
- `src/components`: LMS panels, reusable controls and route guards.
- `src/services`: API client, navigation and request helpers.
- `src/assets`: application assets only.
- `src/main.jsx`: browser entrypoint.

## Commands

```powershell
npm ci
npm run dev
npm test
npm run lint
npm run build
```

The API base defaults to same-origin paths and can be overridden with `VITE_API_URL`.
Vite proxies `/api` to Docker at `http://127.0.0.1:8080`; start that stack with
`docker compose -f compose.yaml -f compose.dev.yaml up -d --build` from the repo root.
For a standalone host backend, set `$env:DEV_API_PROXY_TARGET='http://localhost:3000'`
before `npm run dev`. Vite uses strict port5173; a busy port is reported instead of silently changing origins.
Google OAuth sign-in/linking is retired; no OAuth build variables or SDK are used.
See [compatibility notice](../docs/google-sign-in.md). Gemini keys belong only in backend runtime.
Dashboard and course data come from authenticated APIs; there is no `src/data`
prototype store. See [isolated acceptance testing](../docs/acceptance-testing.md)
before running tests that provision or clean database records.

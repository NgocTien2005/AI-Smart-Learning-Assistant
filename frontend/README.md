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

The API base URL defaults to `http://localhost:3000` and can be overridden with `VITE_API_URL`.
Dashboard and course data come from authenticated APIs; there is no `src/data`
prototype store. See [isolated acceptance testing](../docs/acceptance-testing.md)
before running tests that provision or clean database records.

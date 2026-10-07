# Lumina LMS frontend

React/Vite client for the Lumina LMS prototype.

## Structure

- `src/app`: application shell and route composition.
- `src/pages`: page-level UI and page styles.
- `src/data`: local prototype data used by the course detail page.
- `src/assets`: application assets only.
- `src/main.jsx`: browser entrypoint.

## Commands

```powershell
npm ci
npm run dev
npm run lint
npm run build
```

The API base URL defaults to `http://localhost:3000` and can be overridden with `VITE_API_URL`.

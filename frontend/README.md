# Frontend

React + TypeScript + Vite + Tailwind CSS dashboard.

## Package Manager
Use `pnpm`.

## Local Development

```bash
pnpm install
pnpm run dev
```

App URL:
- http://localhost:5173

## Build

```bash
pnpm run build
```

## Structure

```text
src/
  app/
  pages/
  components/
  hooks/
  services/
  styles/
  types/
```

## Notes
- API base URL defaults to `http://localhost:8000/api`
- Override with `VITE_API_BASE` if needed.

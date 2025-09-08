# Shopkeeper Sales Compass

React (Vite + TS) app for sales entry, inventory, customers, and Supabase sync.

## Quick start

```bash
git clone <repo>
cd shopkeeper-sales-compass
npm install
cp .env.example .env # add your values
npm run dev
```

Dev server runs on http://localhost:8080

## Environment variables

Add these to `.env`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build locally
- `npm run type-check`: TS type check (no emit)
- `npm run lint`: ESLint
- `npm run format`: Prettier format

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix)
- React Router, TanStack Query
- Supabase (`@supabase/supabase-js`)

## Project docs

See detailed docs:

- `docs/frontend-architecture.md`
- `docs/api-integration.md`
- `docs/sync-system.md`
- `docs/security-implementation.md`

## Development notes

- TypeScript is in strict mode.
- Supabase credentials are loaded via `import.meta.env`. Never commit real keys.
- Use npm (lockfile managed via `package-lock.json`).

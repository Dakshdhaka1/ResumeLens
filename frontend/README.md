# ResumeLens frontend

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion + Recharts.
See the [root README](../README.md) for setup and [DESIGN.md](../DESIGN.md) for the design system.

- `npm run dev`: dev server on :3000 (expects the FastAPI backend on :8000; `/api/*` is proxied to it)
- `npm run build`: production build
- `npm run screenshots`: Playwright screenshots into `../screenshots/` (both servers must be running)

Design tokens live in `app/globals.css` (Tailwind v4 uses CSS `@theme` instead of `tailwind.config.ts`).

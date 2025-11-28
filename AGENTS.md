# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router entry; `page.tsx` renders the planner UI, `layout.tsx` wires global wrappers, `globals.css` holds Tailwind base styles.
- `src/components`: Reusable UI such as `dashboard.tsx`, `employee-form.tsx`, `employee-list.tsx`, `schedule-preview.tsx`. Keep new UI in this folder; prefer one component per file.
- `src/lib` and `src/types`: Shared helpers and type definitions. Add new utilities to `src/lib` instead of inlining logic in components.
- `prisma`: Database schema (`schema.prisma`) and migrations. Run Prisma commands from the repo root so generated client matches the schema.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js in dev mode with hot reload.
- `npm run build`: Production build; fixes type errors and blocks on unresolved imports.
- `npm run start`: Serve the production build locally.
- `npm run lint`: ESLint (Next.js config + TypeScript) with Tailwind plugin support; run before pushing.
- `npm run prisma:generate`: Regenerate Prisma client after schema changes.
- `npm run prisma:migrate`: Create/apply migrations in development; supply `DATABASE_URL` in `.env`.
- `npm run prisma:studio`: Open Prisma Studio for quick data inspection.

## Coding Style & Naming Conventions
- Language: TypeScript + React server/client components. Prefer server components unless client features are required.
- Files use kebab-case; components are PascalCase exports. Keep props typed with interfaces/types in `src/types`.
- Styling: Tailwind CSS (see `globals.css` and `tailwind.config.ts`); co-locate utility classes with markup, avoid ad-hoc inline styles.
- Linting/formatting: Run `npm run lint`; adhere to 2-space indentation and trailing commas where eslint suggests.

## Testing Guidelines
- No automated tests exist yet; add Jest + React Testing Library for UI and `*.test.ts(x)` naming in `src`.
- Minimum ask: keep `npm run lint` clean. When adding tests, target high-value logic (scheduling helpers, form validation) and aim for meaningful coverage over threshold numbers.
- Use realistic fixtures and cover both server and client behaviors; mock Prisma boundaries.

## Commit & Pull Request Guidelines
- Recent history is inconsistent; use clear, imperative subjects (e.g., `Add employee CRUD validations`). Conventional Commits are welcome for clarity (`feat:`, `fix:`).
- Keep commits scoped and ordered: schema/migrations separate from UI changes when possible.
- PRs should include: summary of intent, testing performed (`npm run lint`, build), screenshots/GIFs for UI changes, and note any schema or env updates. Link issues or tasks when available.

## Environment & Data Notes
- Configure `.env` with `DATABASE_URL` (e.g., local PostgreSQL) before running Prisma commands; do not commit secrets.
- After schema edits, run `npm run prisma:migrate` followed by `npm run prisma:generate`, and restart the dev server to pick up the new client.

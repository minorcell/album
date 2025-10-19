# Repository Guidelines

## Project Structure & Module Organization

- Next.js App Router. Pages live in `app/` (e.g., `app/album/[id]/page.tsx`); API routes in `app/api/*/route.ts`.
- UI components in `components/` (kebab-case files like `photo-grid.tsx`; component names PascalCase).
- Server utilities and configuration in `lib/` (auth, db, guards, storage).
- Data model in `prisma/schema.prisma`. Static assets in `public/`. Global styles in `app/globals.css`.
- Key configs: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`. Env files: `.env`, `.env.example`.

## Build, Test, and Development Commands

- `pnpm dev` — start local dev server.
- `pnpm build` — production build.
- `pnpm start` — run the built app.
- `pnpm lint` — run ESLint and fix issues.
- `pnpm prisma:generate` — generate Prisma client from `schema.prisma`.
- `pnpm prisma:push` — sync schema to the database.
- Optional: `scripts/dev-start.sh`, `scripts/prod-start.sh` for environment-specific starts.

## Coding Style & Naming Conventions

- TypeScript + React functional components; prefer hooks and server components/actions where appropriate.
- Filenames: kebab-case (`upload-form.tsx`, `auth-guards.ts`). Components: PascalCase.
- Use Tailwind CSS utilities; keep styles in JSX; minimize custom CSS.
- Follow ESLint rules (`pnpm lint`); keep imports clean; avoid unused code.

## Testing Guidelines

- No formal test suite yet. Add tests under `__tests__/` or `*.test.ts` near sources.
- Focus tests on `lib/*` and `app/api/*` routes; mock Prisma DB where possible.
- Keep tests fast and deterministic; document fixtures.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat`, `fix`, `refactor`, `build`, `docs` with optional scope (e.g., `feat(search): add album search`).
- PRs include: clear description, linked issues, steps to verify, and screenshots for UI changes.
- Keep PRs small and focused; update docs when behavior changes.

## Security & Configuration Tips

- Copy `.env.example` to `.env` and set DB, NextAuth, storage (TOS), and branding vars.
- Never commit secrets. After schema/config changes, run `pnpm prisma:push` and restart.
- Containerization via `dockerfile` is available; ensure envs are provided at runtime.

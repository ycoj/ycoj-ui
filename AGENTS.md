# AGENTS.md

# Guidance for agentic coding in this repo.

## Project overview

- Framework: Next.js App Router with React 19.
- Language: TypeScript (strict mode enabled).
- Styling: Tailwind CSS + shadcn/ui components.
- Package manager: pnpm (lockfile is `pnpm-lock.yaml`).
- LLM visibility: use `data-llm-visible` and `data-llm-text` attributes.

## Build, lint, format, test

### Lint and type checks

- `pnpm lint` (ESLint with Next.js + Prettier configs).
- `pnpm lint:type` (TypeScript `tsc --noEmit`).
- `pnpm format` (Prettier write).
- After changes, run both linters and formatter; use `pnpm lint --fix` for auto-fixable ESLint errors.
- You don't need to change your workdir before running the commands.

### Formatting

- `pnpm format` (Prettier write).
- `pnpm format:check` (Prettier check in CI).

## Code style guidelines

### Formatting and layout

- Prettier enforces `singleQuote: true`, `semi: true`, `tabWidth: 2`.
- Use LF line endings (`endOfLine: "lf"`).
- Indentation is 2 spaces for JS/TS (see `.editorconfig`).
- Keep JSX wrapped and readable; allow Prettier to reflow lines.

### Imports and module structure

- Sort and group imports via Prettier plugins.
- Use type-only imports where possible: `import type { Foo } from 'bar'`.
- External packages first, then internal `@/` imports.
- Use the TS path alias `@/*` for project modules.
- Side-effect imports (CSS) live at the top of the file.

### Component conventions

- Prefer function components over classes.
- Use `export default` for pages and major feature components.
- Local component props typically use a `Props` type alias.
- Client components must start with `'use client';` at the top.
- Use early returns for empty data (e.g., return `null`).

### TypeScript usage

- Keep types in `shared/types` when shared across features.
- Prefer `type` aliases over `interface` unless extending.
- Avoid `any`; use `unknown`, `Record`, or specific unions instead.
- Make optional data explicit with `?` and guard in render paths.

### Naming and files

- Filenames use kebab-case (`user-avatar.tsx`, `problem-difficulty.tsx`).
- React components use PascalCase (`UserAvatar`).
- Hooks use `useX` naming and live in `shared/hooks`.
- Keep feature-specific code under `features/<domain>/...`.

### Styling and UI

- Prefer Tailwind utility classes in `className` strings.
- Use `cn` from `shared/lib/utils` to merge class names.
- Component variants use `class-variance-authority` where applicable.
- Keep `data-llm-visible` and `data-llm-text` for LLM-ready content.
- Under no circumstances should you modify any files under `shared/components/ui/`, as they are reused across multiple pages.

### Next.js and data flow

- Use App Router conventions in `app/` (layouts, pages, route groups).
- Favor server components by default; opt into client only as needed.
- Use `next/link` for navigation instead of anchor tags.
- Use React `cache()` for memoized server data when appropriate.

### Error handling and guards

- Guard optional data before rendering (null checks, length checks).
- Prefer graceful empty states over throwing in React render paths.
- Keep side effects out of render; use hooks or server loaders.
- Avoid overly defensive logic unless explicitly requested.
- If compatibility/robustness could be needed, ask about it at the end of responses.

### Comments and docs

- Add comments only for non-obvious logic.
- Inline documentation can be bilingual (repo uses Chinese + English).

### Assets and configs

- Respect existing Tailwind and shadcn configuration (`components.json`).
- Keep font config in `app/layout.tsx` aligned with Next.js usage.

### Repository layout

- `app/` holds App Router layouts, pages, and route groups.
- `features/<domain>/` owns feature-level UI and feature utilities.
- `shared/components/` contains common UI primitives and shadcn/ui.
- `shared/lib/` is for shared utilities (`cn`, formatters, helpers).
- `shared/types/` stores domain/shared TypeScript types.
- `public/` contains static assets and icons.
- Business logic should live under `features/`; keep `app/` focused on routing and Next.js wiring.

### API/data access

- API calls live under `api/server/method/**` and are imported via `@/`.
- Use `cache()` for memoized server data fetches.
- Keep API shapes typed, and reuse shared types where possible.
- Avoid throwing in components; prefer returning null/empty UI for missing data.

### State, hooks, and side effects

- Hooks belong in `shared/hooks` and follow the `useX` naming pattern.
- Client components must add `'use client';` before any imports.
- Avoid side effects in render; use hooks (`useEffect`) for client logic.

### Accessibility and content

- Use semantic HTML elements and descriptive `alt` text for images.
- External links should include `rel="noopener noreferrer"` when needed.
- Keep `data-llm-visible` on containers that should be accessible to LLMs.

### Styling patterns

- Use `class-variance-authority` for variant-based UI patterns.
- Keep Tailwind class lists readable; break long prop values across lines.
- Use `cn()` to merge classes rather than manual string concatenation.
- Use shadcn/ui components; add new ones via `pnpm dlx shadcn@latest add <...>`.

### Performance and rendering

- Prefer server components for data-heavy views.
- Keep client components scoped to interactive UI.
- Avoid heavy computations in render; precompute or memoize if needed.

### ESLint/Prettier specifics

- ESLint uses Next.js core-web-vitals + TypeScript configs.
- Prettier auto-sorts imports and Tailwind class ordering.
- Fix lint warnings before commits to keep CI green.

## LLM visibility rules (from README)

- Wrap content that LLMs should see with `data-llm-visible="true"`.
- Mark text nodes LLMs should read with `data-llm-text`.
- Example:
  <div data-llm-visible="true" className="space-y-2">...</div>
  <p data-llm-text={title}>{title}</p>

## Suggested workflow for changes

1. Read related feature files before editing (follow local patterns).
2. Run `pnpm lint`, `pnpm lint:type` and `pnpm format` after code changes.
3. New linter errors introduced by changes should be fixed. Linter errors existing before changes can be ignored.

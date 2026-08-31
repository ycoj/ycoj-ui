---
name: ycoj-code-style
description: Write, modify, or refactor code in the YCOJ UI repository using its established TypeScript, React, API, form, localization, and testing conventions. Apply to implementation work in this repo; not needed for unrelated tasks or prose-only edits.
---

# YCOJ Code Style

Make changes fit the surrounding code without expanding the requested work into a style migration.

## Before editing

- Read the root `AGENTS.md` and any instructions in the target directory. They contain repository boundaries and verification commands; this skill owns the coding requirements and patterns inferred from source.
- Read the target file and a nearby implementation with the same responsibility, including its caller and relevant tests. Use the examples below when there is no close neighbor. All source paths below are relative to the repository root.
- Treat inferred patterns as defaults, not universal rules. Explicit user instructions and applicable `AGENTS.md` rules take precedence. Do not copy a legacy exception just because it exists or rewrite unrelated files to make them uniform.
- For Next.js work, read the relevant installed guide under `node_modules/next/dist/docs/` before coding. Check installed dependencies and current source when an older example differs.

## Repository coding requirements

These requirements are carried over from `AGENTS.md`; they are explicit project rules, distinct from the inferred patterns below.

- Follow `.prettierrc` and `.editorconfig`: single quotes, semicolons, two-space indentation, and LF line endings. Keep JSX readable and let Prettier handle wrapping, imports, and class ordering. Keep CSS side-effect imports at the top of the import section.
- Prefer `type` aliases unless extending an interface. Avoid `any`; use `unknown`, specific unions, or typed records. Express optional values explicitly and guard them before rendering.
- Use early returns and graceful empty states for missing data rather than throwing during React render. Avoid overly defensive logic unless explicitly requested.
- Add comments only for type definitions or complex logic; write all comments and inline documentation in English.
- Keep user-facing copy focused on user goals, without implementation details or protocol fields that do not help the user act.
- Use `next/link` for navigation, descriptive image `alt` text, and `rel="noopener noreferrer"` on external links when needed.
- Respect the existing Tailwind and shadcn configuration in `components.json`. Use `class-variance-authority` for component variants where appropriate; add new shadcn primitives with `pnpm dlx shadcn@latest add <component>`, following the execution rules in `AGENTS.md`.
- Keep static assets in `public/` and font configuration in `app/layout.tsx` aligned with Next.js usage.
- Avoid heavy computations in render; precompute or memoize where needed.
- Component tests use `@testing-library/react` with `vitest.setup.ts` and `@testing-library/jest-dom`. Fix lint warnings before committing.

## Ownership and module shape

- Keep route modules focused on awaiting route inputs, loading data, handling route errors, metadata, and feature composition. Put domain UI and logic in `features/<domain>/`, using existing subfolders such as `list`, `detail`, `form`, `create`, and `edit`.
- Keep feature-specific schemas, payload builders, and pure helpers near their consumers. Promote them to `shared/lib` or `shared/types` only when they serve multiple features. Keep custom hooks in `shared/hooks` and name them `useX`.
- Main components are usually default-exported named functions with a local `type Props` and destructured arguments. Utilities and types commonly use named exports; retain existing public export contracts.
- Use kebab-case files, PascalCase components/types, camelCase functions/variables, and descriptive domain names. Prefer small domain helpers over adding a generic framework for a single use case.
- Prefer `@/` for project imports and type-only imports for types. Nearby files also use relative sibling imports; do not churn those unnecessarily. Let `.prettierrc` sort imports and Tailwind classes instead of inventing an import-group scheme.

## Server/client and API boundaries

- Keep data-heavy views on the server and interactive controls in client components. Put `'use client';` first in client entry files; do not turn a whole route into a client component just to add one control.
- Reuse a feature-level `cache()` loader when metadata and the page need the same request. For new server-only loaders, use the actual side-effect import `import 'server-only';` as in `features/contest/edit/get-contest-edit.ts`; a standalone `'server-only';` string found in older files does not enforce the boundary.
- Await promise-based route inputs following current pages and installed Next.js docs. Use `Promise.all` for independent asynchronous reads where it improves the existing flow.
- Use the configured Alova instances: `alova` in server methods and `clientRequest` in client methods. Keep endpoints and transport payloads under `api/server/method/**` or `api/client/method/**`, exposing methods through the existing domain/root API objects.
- Reuse domain types and keep endpoint-specific response types with the method. Preserve backend field names and operation values; adapt form values in a named payload helper when needed.
- Follow the endpoint's existing response contract. For `Errorable<T>`, narrow with `'error' in data` and use the existing error UI. Client methods may throw or return error payloads depending on the API configuration; inspect that path instead of assuming all requests behave alike.

## Forms and state

- For substantial forms, follow the existing `react-hook-form` plus Zod pattern: infer value types from the schema, supply explicit defaults, and use `Controller` for controlled inputs/editors.
- Reuse a common form when create/edit flows share fields. Keep mutation-specific behavior in the wrappers, passing defaults and an `onSubmit` callback as in the problem feature.
- Keep schema construction, default selection, and payload normalization in pure helpers when this makes nontrivial logic easier to test. Pass translated validation messages into schema builders rather than embedding a UI locale in utilities.
- Use the form's `isSubmitting` for pending controls and the existing field/root error presentation for failures. Navigate or refresh only after success. Do not add duplicate state for values already supplied by form state or props.
- Match the local effect cleanup pattern for timers, subscriptions, and browser resources. Keep side effects out of render.

## UI and localization

- Reuse the existing shared components and layouts. Keep the `shared/components/ui/` modification restriction in `AGENTS.md`; ordinary feature styling belongs at call sites.
- Current components use `lucide-react` icons. Prefer installed dependencies and existing primitives over copying outdated icon imports from older scaffolding examples.
- Follow neighboring Tailwind spacing and responsive layout patterns. Use semantic colors such as `text-muted-foreground`, `bg-card`, and `border-border` for ordinary UI; keep intentional domain/status colors and their dark variants. Use `cn()` for conditional classes and existing variant helpers when available.
- Use `next-intl` namespaces for user-facing copy: `getTranslations` in async server views and `useTranslations` in synchronous components. Maintain corresponding keys in `messages/zh.json` and `messages/en.json`; use existing locale-aware formatters for displayed dates/numbers.
- Preserve semantic headings, labels, pending/disabled behavior, and accessible errors. Match `data-llm-visible="true"` containers and `data-llm-text` values to the content users actually see, including translated text.

## Tests and completion

- Colocate meaningful behavior tests as `*.test.ts` or `*.test.tsx` with explicit Vitest imports. Prefer table-driven cases for pure helpers, including relevant boundaries and contract-preserving behavior.
- Component tests use Testing Library roles/labels and user interactions. Reuse local fixtures/providers; mock API and navigation boundaries rather than internal component mechanics. Cover pending, failure, or permission behavior when the change affects it.
- Do not add tests that merely assert formatting, implementation wording, or trivial wrappers. Do not introduce benchmarks unless the task calls for performance measurement.
- Follow the exact formatter, lint, type-check, and test workflow in `AGENTS.md`. Inspect the final diff for unrelated functional changes and report checks that failed or could not run. Do not start a development server without the user's explicit request.

## Source examples to consult as needed

| Work                                | Existing examples                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Route and cached loader             | `app/(app)/problem/[pid]/page.tsx`, `features/contest/edit/get-contest-edit.ts`                                     |
| Localized server UI                 | `features/problem/detail/problem-content.tsx`                                                                       |
| Typed API and domain exports        | `api/server/method/problems/detail.ts`, `api/client/method/messages/send.ts`, `api/client/method/messages/index.ts` |
| Shared form and thin wrapper        | `features/problem/form/problem-form.tsx`, `features/problem/create/problem-create-form.tsx`                         |
| Pure form helpers and contracts     | `features/account/settings/settings-form-utils.ts`, `features/account/settings/settings-form-utils.test.ts`         |
| Status styling and list composition | `features/contest/list/contest-list.tsx`                                                                            |
| Interaction tests                   | `features/account/settings/account-settings-page.test.tsx`                                                          |
| Hook resource cleanup               | `shared/hooks/use-clipboard-copy.ts`                                                                                |

These are examples of particular patterns, not templates to copy wholesale. Recheck their current contents when applying the skill.

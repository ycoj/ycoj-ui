---
name: add-page
description: Scaffold a new page in this Next.js App Router project following the feature-based architecture. Use when the user asks to create a new page, route, view, or screen.
---

This project uses a strict feature-based architecture. The `app/` directory handles routing only; all business logic and UI live under `features/<domain>/`.

## Architecture overview

```
app/(app)/<route>/page.tsx        ← Thin routing shell: params, data fetch, compose features
features/<domain>/                ← All UI components, helpers, and data-fetching logic
shared/components/                ← Reusable primitives and shadcn/ui (NEVER modify shared/components/ui/)
shared/layout/                    ← Layout components (e.g. TwoColumnLayout)
shared/lib/                       ← Utilities (cn, formatters, helpers)
shared/types/                     ← Shared TypeScript types
api/server/method/                ← Server-side API methods (used in server components)
api/client/method/                ← Client-side API methods (used in client components)
```

## Step-by-step

### 1. Create the route page in `app/`

- Place the file under `app/(app)/<route>/page.tsx` (or `app/(public)/` for unauthenticated pages).
- The page component should be an `async` server component by default.
- Keep it thin: resolve params/searchParams, fetch data, compose feature components.
- Export `metadata` (static) or `generateMetadata` (dynamic) for the page title.

```tsx
// app/(app)/example/page.tsx
import ServerApis from '@/api/server/method';
import ExampleContent from '@/features/example/example-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '示例页面',
};

export default async function ExamplePage() {
  const data = await ServerApis.Example.getExampleList();
  return (
    <div className="space-y-4">
      <ExampleContent data={data} />
    </div>
  );
}
```

### 2. Create feature components under `features/<domain>/`

- Group by domain (e.g. `features/contest/`, `features/problem/`).
- Use sub-folders for logical grouping: `list/`, `detail/`, `submit/`, etc.
- Filenames use kebab-case. Component names use PascalCase.
- Use `export default` for the main component of each file.
- Define a `Props` type alias for component props.

### 3. Data fetching pattern

For server-side data that may be reused (e.g. in both `generateMetadata` and the page body), create a cached fetcher in the feature folder:

```ts
// features/example/detail/get-example-detail.ts
'server-only';

import ServerApis from '@/api/server/method';
import type { ExampleDetailResponse } from '@/api/server/method/example/detail';
import { cache } from 'react';

export const getExampleDetail = cache(
  async (id: string): Promise<ExampleDetailResponse> => {
    return await ServerApis.Example.getExampleDetail(id);
  }
);
```

- Use `'server-only'` at the top to prevent accidental client imports.
- Wrap with React `cache()` for request-level deduplication.

### 4. Client components

- Add `'use client';` as the very first line, before any imports.
- Keep client components scoped to interactive UI only.
- Use client API methods from `api/client/method/` for mutations.
- Use `useRouter`, `useSearchParams`, `usePathname` from `next/navigation`.
- Use `react-hook-form` + `zod` for form handling (see `problem-submit-form-client.tsx` for reference).

### 5. Dynamic route pages

For pages with URL params (e.g. `[pid]`, `[tid]`):

```tsx
type Params = { pid: string };
type SearchParams = { tid?: string };

export default async function DetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  // ...
}
```

- Both `params` and `searchParams` are `Promise`-based (Next.js 15+ / React 19).
- Await them at the top of the component.

## Styling rules

- Use Tailwind utility classes for all styling.
- Use `cn()` from `@/shared/lib/utils` for conditional class merging. It combines `clsx` + `tailwind-merge`.
- Use shadcn/ui components from `@/shared/components/ui/`. Add new ones via `pnpm dlx shadcn@latest add <component>`.
- Use `class-variance-authority` for variant-based component styling.
- Icons come from `@hugeicons/core-free-icons` + `@hugeicons/react`.

```tsx
import { cn } from '@/shared/lib/utils';

<div
  className={cn(
    'rounded-xl border bg-card/40',
    isActive && 'ring-2 ring-primary'
  )}
/>;
```

## LLM visibility

- Add `data-llm-visible="true"` on containers whose content should be readable by LLMs.
- Add `data-llm-text={value}` on text elements for LLM-accessible text.

## Layout patterns

- Use `TwoColumnLayout` from `@/shared/layout/two-column` for detail pages with a sidebar.
- Supports `ratio` prop: `'7-3'` (default) or `'8-2'`.
- List pages typically use `space-y-4` vertical stacking with filter, list, and pagination.

## Shared components available

- `Pagination` — `@/shared/components/pagination`
- `TwoColumnLayout` — `@/shared/layout/two-column`
- `Markdown` — `@/shared/components/markdown`
- `MarkdownEditor` — `@/shared/components/markdown-editor`
- `CodeRenderer` — `@/shared/components/code/code-renderer`
- All shadcn/ui primitives — `@/shared/components/ui/*`

## Checklist

- [ ] Route page in `app/` is thin (routing + data fetch + composition only)
- [ ] Feature components live under `features/<domain>/`
- [ ] Server components by default; `'use client'` only when needed
- [ ] `metadata` or `generateMetadata` exported for page title
- [ ] Shared data fetchers use `cache()` + `'server-only'`
- [ ] Types use `type` aliases; shared types go in `shared/types/`
- [ ] `cn()` used for conditional class names (never manual string concat)
- [ ] `data-llm-visible` and `data-llm-text` on key content
- [ ] `next/link` for navigation, not `<a>` tags
- [ ] Guard optional data with null checks / early returns
- [ ] Run `pnpm lint`, `pnpm lint:type`, `pnpm format` after changes

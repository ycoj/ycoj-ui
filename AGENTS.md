# AGENTS.md

# Guidance for agentic coding in this repo.

## Required coding skill

Before writing, modifying, or refactoring code in this repository, read and apply
[ycoj-code-style](.agents/skills/ycoj-code-style/SKILL.md). It records conventions
inferred from the existing source and the repository coding requirements.
Keep code-style guidance in that skill rather than duplicating it here.
When delegating implementation work, tell each coding agent to read this skill
and the applicable `AGENTS.md` instructions before editing. This does not require
delegation for tasks that can be completed directly.

## Project overview

- Framework: Next.js App Router with React 19.
- Language: TypeScript (strict mode enabled).
- Styling: Tailwind CSS + shadcn/ui components.
- Package manager: pnpm (lockfile is `pnpm-lock.yaml`).

## Build, lint, format, test

If you are Codex, you should run all `pnpm` commands outside of sandbox.

### Lint and type checks

- `pnpm lint` (ESLint with Next.js + Prettier configs).
- `pnpm lint:type` (TypeScript `tsc --noEmit`).
- `pnpm format` (Prettier write).
- After changes, run both linters and formatter; use `pnpm lint --fix` for auto-fixable ESLint errors.
- You don't need to change your workdir before running the commands.

### Formatting

- `pnpm format` (Prettier write).
- `pnpm format:check` (Prettier check in CI).

### Unit tests

- `pnpm test` (Vitest single run, used in CI).
- `pnpm test:watch` (Vitest watch mode for local development).
- After test changes, run `pnpm test` in addition to lint/type/format.

### Benchmarks

- `pnpm bench` (Vitest benchmarks, measured in CI by CodSpeed).
- Colocate benchmarks as `*.bench.ts` next to the source file.
- Benchmark pure helpers only; avoid network access, timers and randomness so
  results stay comparable between runs.

## Repository boundaries

- Unless the user explicitly requests it, do not modify files under `shared/components/ui/`, as they are reused across multiple pages.
- If compatibility/robustness could be needed, ask about it at the end of responses.

## Suggested workflow for changes

1. Read related feature files before editing (follow local patterns).
2. Run `pnpm lint`, `pnpm lint:type`, `pnpm test` and `pnpm format` after code changes. Do not prefix these commands with additional content. That is, do not run `cd ... && pnpm lint`, `pnpm lint 2>&1`, `pnpm format -- <some file`, etc. Run only `pnpm lint`, `pnpm lint:type`, `pnpm test` and `pnpm format`.
3. New linter errors introduced by changes should be fixed. Linter errors existing before changes can be ignored.
4. Do not start a development server unless the user explicitly asks for one.
5. Changes produced by `pnpm format` are intentional formatting updates and must not be reverted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

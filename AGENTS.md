# YCOJ-UI Agents.md

## Required coding skill

Before writing, modifying, or refactoring code in this repository, read and apply
[ycoj-code-style](.agents/skills/ycoj-code-style/SKILL.md). It records conventions
inferred from the existing source and the repository coding requirements.
Keep code-style guidance in that skill rather than duplicating it here.
When delegating implementation work, tell each coding agent to read this skill
and the applicable `AGENTS.md` instructions before editing. This does not require
delegation for tasks that can be completed directly.

## Repository boundaries

- Unless the user explicitly requests it, do not modify files under `shared/components/ui/`, as they are reused across multiple pages.
- If compatibility/robustness could be needed, ask about it at the end of responses.

## Collaboration

- Use conventional commits messages for both commit messages and PR titles.
- Add yourself to commit co-author. For example, if you are Codex, add `Co-authored-by: Codex <codex@openai.com>` to commit message.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

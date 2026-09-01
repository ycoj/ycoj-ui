# Legacy UI migration TODO

This backlog records user-facing features found in the legacy YCOJ repository
that are not present, or are only partially present, in this UI.

- Audited on 2026-08-31.
- Legacy source: `../YCOJ` at `5c0d6cd34a6d8cfb81435b035b6e25d59596ace2`.
- New UI baseline: this repository at
  `ffa05d297aa9f6fb2ea28b1795379ee54cad59f7`.
- Sources of truth: legacy route registrations, handlers, templates, and installed
  user-facing plugins, compared with the new UI's `app/`, `features/`, and
  `api/` trees.

A feature is complete only when its route and controls are reachable, permission
checks and backend contracts are preserved, user-facing copy is localized, and
the important success and failure paths are tested. Machine endpoints and
backend-transparent integrations are intentionally excluded near the end of
this file.

## P0: account, domain, and administration

### Authentication and account lifecycle

- [ ] Add registration, verification-code registration, and invitation-code
      registration flows (`/register` and `/register/:code`).
- [ ] Add forgot-username/password, reset-email confirmation, and password reset
      flows (`/lostpass` and `/lostpass/:code`).
- [ ] Complete normal login challenges for TOTP and WebAuthn. Sudo currently
      supports these challenges, but the normal login page does not.
- [ ] Render backend-provided OAuth login methods, including the installed
      GitHub, Google, OIDC, and Telegram providers.
- [ ] Add account deletion and its confirmation/pending states.

Legacy evidence:
[`handler/user.ts`](../YCOJ/packages/hydrooj/src/handler/user.ts). Current entry
points: [`app/(public)`](<app/(public)>) and
[`features/auth`](features/auth).

### Security and personal settings

- [ ] Add the security center: change password, change email, and show pending
      email verification.
- [ ] Add linked-account management for linking and unlinking OAuth identities.
- [ ] Add TOTP and WebAuthn authenticator enrollment, listing, and removal.
- [ ] Add active-session details and single-session/all-session revocation,
      including GeoIP location when supplied by the backend.
- [ ] Migrate preference settings and per-domain settings. Preserve legacy
      editor/display preferences such as editor choice, invisible characters,
      auto-format, fonts, relative time, animation, and rounded-corner preferences
      where they still apply to the new design.

Legacy evidence:
[`handler/home.ts`](../YCOJ/packages/hydrooj/src/handler/home.ts) and
[`home_security.html`](../YCOJ/packages/ui-default/templates/home_security.html).
The current settings navigation contains only
[`/home/settings/account`](features/account/settings/settings-sidebar.tsx).

### Personal domains and files

- [ ] Add My Domains with create, search/join, pin/star, visit/manage, and leave
      actions.
- [ ] Add the personal file vault with upload, list, download, and delete actions.
- [ ] Add personal award certification: match verified identity records, preview
      awards, bind a record, and display the bound certification.

Legacy evidence:
[`handler/home.ts`](../YCOJ/packages/hydrooj/src/handler/home.ts),
[`handler/misc.ts`](../YCOJ/packages/hydrooj/src/handler/misc.ts), and
[`handler/oier.ts`](../YCOJ/packages/hydrooj/src/handler/oier.ts).

### Domain administration

The navigation maps `domain_dashboard` to `/domain`, but no matching route
exists.

- [ ] Add the domain dashboard, domain property editor, discussion-node
      initialization, and domain deletion.
- [ ] Add member search/list, raw export, add/remove, role assignment, and
      membership-expiration controls.
- [ ] Add the domain permission matrix and custom role create/update/delete
      workflows.
- [ ] Add user-group create/update/delete and membership management.
- [ ] Add join policy and invitation-code management.
- [ ] Add join-application review with approve/reject, role/group assignment,
      expiration, and invitation details.
- [ ] Add public domain discovery/search and self-service join.

Legacy evidence:
[`handler/domain.ts`](../YCOJ/packages/hydrooj/src/handler/domain.ts). Current
placeholder mapping:
[`features/navigation/sidebar.tsx`](features/navigation/sidebar.tsx).

### System administration

The current management UI only exposes real-name review and account expiration.

- [ ] Add the system dashboard, health information, and restart action.
- [ ] Add the maintenance script browser/runner with result reporting.
- [ ] Add typed system settings and the raw YAML configuration editor/schema.
- [ ] Add AI provider create/edit/delete, credential handling, and connection
      testing.
- [ ] Add bulk user import with preview/draft and validation failures.
- [ ] Add global user privilege lookup and editing.
- [ ] Add award/OIer record import, lookup, binding, unbinding, and profile
      display.
- [ ] Add administrator account impersonation/switching and contest-mode
      controls. Keep debug-only heap snapshots out of ordinary navigation.

Legacy evidence:
[`handler/manage.ts`](../YCOJ/packages/hydrooj/src/handler/manage.ts),
[`handler/oier.ts`](../YCOJ/packages/hydrooj/src/handler/oier.ts), and
[`handler/misc.ts`](../YCOJ/packages/hydrooj/src/handler/misc.ts). Current
coverage: [`features/manage`](features/manage).

## P1: core product workflows

### Homepage

- [ ] Render the configurable homework, training, ranking, problem-search,
      recent-problems, starred-problems, discussion-node, and Hitokoto widgets.
- [ ] Preserve the legacy configurable ordering/column contract, or define and
      document an intentional replacement instead of silently dropping unknown
      sections.

The response types already describe some unrendered sections, while
[`features/homepage/homepage.tsx`](features/homepage/homepage.tsx) renders only
banner, bulletin, contests, discussions, check-in, countdown, suggestions, and
recent blogs. Legacy evidence:
[`templates/main.html`](../YCOJ/packages/ui-default/templates/main.html) and
[`templates/partials/homepage`](../YCOJ/packages/ui-default/templates/partials/homepage).

### Problems and solutions

- [ ] Add random-problem navigation and restore list sorting/category filters.
- [ ] Add privileged bulk problem copy, hide/unhide, export/download, and delete
      actions.
- [ ] Add problem star/unstar, whole-problem rejudge, and delete controls with
      permission-aware confirmation.
- [ ] Replace the problem discussion `href="#"` placeholder with the
      problem-scoped discussion node and creation flow.
- [ ] Add hacking/custom-test submission and result tracking.
- [ ] Add per-problem submission statistics with language/status sorting and
      accepted-submission links.
- [ ] Add direct single-solution views, pagination, raw Markdown/history, and
      solution reply threads with create/edit/delete controls. Reply APIs exist but
      are not rendered.

Legacy evidence:
[`handler/problem.ts`](../YCOJ/packages/hydrooj/src/handler/problem.ts). Partial
new UI:
[`features/problem/sidebar.tsx`](features/problem/sidebar.tsx) and
[`features/problem/solution`](features/problem/solution).

### Discussions

- [ ] Add topic creation for global, problem, contest, and other backend-provided
      discussion nodes. The current create link targets a nonexistent route.
- [ ] Add topic edit and delete workflows.
- [ ] Add star/unstar, reaction, lock/unlock, pin/highlight/hide moderation, and
      reporting controls where permitted.
- [ ] Add edit/delete controls for floor replies and nested replies. Client
      methods already exist but have no UI callers.
- [ ] Add raw Markdown/history access and node-specific list routes/filters.

Legacy evidence:
[`handler/discussion.ts`](../YCOJ/packages/hydrooj/src/handler/discussion.ts).
Partial new UI: [`features/discussion`](features/discussion) and
[`api/client/method/discussion/reply.ts`](api/client/method/discussion/reply.ts).

### Contests and scoreboards

- [ ] Add contest solution create/edit/detail/delete UI, including replies and
      votes. Server and client methods exist without routes or feature components.
- [ ] Add printable problem sets, DOMjudge-compatible printing, print-kiosk
      enablement, and print-task submission.
- [ ] Add export-all-code/download-all-submissions.
- [ ] Add explicit participant-facing public/private attachment downloads.
- [ ] Add contest delete, early-end, subscription, protected-contest code prompt,
      and contextual submission/record shortcuts where allowed by the handler.
- [ ] Replace the contest discussion `href="#"` placeholder with the contest
      discussion node.
- [ ] Restore scoreboard group/rank/starred-user filtering. Backend-provided
      alternate views and scoreboard unlock are already migrated.

Legacy evidence:
[`handler/contest.ts`](../YCOJ/packages/hydrooj/src/handler/contest.ts),
[`handler/contest/solution.ts`](../YCOJ/packages/hydrooj/src/handler/contest/solution.ts),
and [`contest_print.html`](../YCOJ/packages/ui-default/templates/contest_print.html).
Partial new API:
[`api/server/method/contests/solution.ts`](api/server/method/contests/solution.ts)
and [`api/client/method/contest/solution.ts`](api/client/method/contest/solution.ts).

### Homework and training

- [ ] Add homework attachment management/downloads and export-all-code.
- [ ] Add homework deletion and contextual submission/record shortcuts.
- [ ] Replace the homework discussion `href="#"` placeholder with its discussion
      node.
- [ ] Add training attachment management/downloads.
- [ ] Restore manager views for inspecting another user's or group's training
      progress.

Legacy evidence:
[`handler/homework.ts`](../YCOJ/packages/hydrooj/src/handler/homework.ts) and
[`handler/training.ts`](../YCOJ/packages/hydrooj/src/handler/training.ts).

### Records and judge status

- [ ] Complete record-list filters for contest, language, own/all submissions,
      all-domain visibility, pretests, and aggregate judge statistics.
- [ ] Add source/file download from record detail while preserving permission
      checks. Live detail, revision selection, rejudge, and cancel are already
      migrated.
- [ ] Add the judge/server status page with online state, OS/CPU/memory/request
      information, compiler versions, and compile commands.

Legacy evidence:
[`handler/record.ts`](../YCOJ/packages/hydrooj/src/handler/record.ts) and
[`handler/status.ts`](../YCOJ/packages/hydrooj/src/handler/status.ts). Partial
new UI: [`features/record`](features/record).

### User profiles

- [ ] Restore profile activity history and certified award records.
- [ ] Preserve permission-aware contact fields and moderator/role badges that
      are present in the legacy profile but absent from the new response contract.

Legacy evidence:
[`user_detail.html`](../YCOJ/packages/ui-default/templates/user_detail.html) and
[`templates/partials/user_detail`](../YCOJ/packages/ui-default/templates/partials/user_detail).

## P2: global UX and content

- [ ] Add the global problem/user omnibar and its Ctrl/Cmd-K entry point.
- [ ] Audit and migrate useful global hotkeys, with discoverability and conflict
      handling appropriate for the new UI.
- [ ] Add Help and About routes, including the legacy contextual help anchors or
      an intentional replacement documentation structure.
- [ ] Define plugin-facing UI extension points for injected user-menu actions,
      create-problem import actions, homepage sections, rich-media renderers, and
      external navigation targets such as `/course` and `/live`.

Legacy evidence:
[`components/omnisearch`](../YCOJ/packages/ui-default/components/omnisearch),
[`components/hotkey`](../YCOJ/packages/ui-default/components/hotkey), and
[`packages/ui-default/index.ts`](../YCOJ/packages/ui-default/index.ts).

## Optional installed plugin UI

These items depend on optional packages in the audited legacy installation and
should not block core parity.

- [ ] Add full user blogs: list, detail, create, edit, delete, star, and user-menu
      navigation. Homepage blog summaries alone do not provide these routes.
- [ ] Add OnlyOffice rich-media viewing for supported document, spreadsheet,
      and presentation files. The existing PDF viewer is not equivalent.
- [ ] Add onsite-toolkit automatic source-tree submission when that plugin is
      enabled. IP login and contest restrictions remain backend-transparent.
- [ ] Ensure dynamic OAuth provider login/linking works for GitHub, Google,
      configurable OIDC, and Telegram without provider-specific UI forks.

Legacy evidence: [`packages/blog`](../YCOJ/packages/blog),
[`packages/onlyoffice`](../YCOJ/packages/onlyoffice), and
[`packages/onsite-toolkit`](../YCOJ/packages/onsite-toolkit).

## Confirmed present or intentionally excluded

Do not create duplicate migration tasks for these features without a new gap:

- Core problem create/read/update, HTML-to-Markdown conversion, config/files, AI
  generation, objective mode, scratchpad, and Hydro/FPS/HOJ/QDUOJ/ZSHFOJ (LVJ)
  imports.
- Core record list/detail, live updates, revisions, rejudge, and cancel.
- Core contest/homework create/read/update; scoreboards, dynamic scoreboard
  exports, unlock, contest users, clarifications, balloons, contest file
  management, and bulk submission. Deletions are noted above.
- Core training CRUD/enrollment/deletion, pastebin, ranking, messages, check-in,
  real-name user/reviewer flows, account-expiration management, language,
  persisted theme selection, and logout.
- Backend-transparent search/judging integrations such as Elastic, Sonic, and
  VJudge.
- Machine or plumbing endpoints: telemetry, metrics, status ingestion, judge
  file transfer, WebSockets, callbacks, raw/signed file delivery, storage
  redirects, compatibility aliases, plugin constants/resources, Markdown/media
  APIs, and navigation/language/media JSON APIs.

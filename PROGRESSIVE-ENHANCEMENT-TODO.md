# Progressive Enhancement TODO

Backlog of pages and interactions that do **not** degrade gracefully when
JavaScript is unavailable or fails to run.

- Audited on 2026-09-10.
- Browser baseline decision: **modern browsers only** (Tailwind v4 baseline:
  Chrome 111+ / Safari 16.4+ / Firefox 128+). Old-browser CSS/JS compatibility
  is therefore out of scope; the remaining gap is **no-JS operability**.
- Goal: core user paths must still work without JS; non-core and administrative
  surfaces may degrade to read-only, but must not silently break.

## Why this backlog exists

- `i18n/request.ts` reads `cookies()`/`headers()`, so every route is dynamically
  server-rendered. Read-only browsing already produces HTML.
- However all mutations are client-only:
  - `0` Server Actions (`'use server'` / `useActionState`).
  - `0 / 26` native `<form action=...>` / `method=...`; every form uses
    `onSubmit` + `preventDefault` + alova XHR.
  - Client API surface is XHR-only: `api/client/method/**`.
- Editors and a few widgets genuinely skip SSR (`ssr: false` or `mounted`
  gating) and have no `<noscript>` fallback.

## Priority scheme

Ordered by urgency. A lower tier never outranks a higher tier; within a tier,
regular-user paths precede admin/management paths.

- **P0 — Core path, blocking**: authentication and judging. Without these the
  product cannot be used at all.
- **P1 — Core regular-user write paths**: high-frequency user actions
  (answering, replying, profile, messaging, enrollment).
- **P2 — Regular-user authoring & discovery**: content creation/editing and
  list filtering for ordinary users (including setters/authors).
- **P3 — Admin / management / advanced tooling**: reviewer, management,
  configuration, and operator surfaces.
- **P4 — Enhancements with missing content fallback**: features that are
  additive, but whose content disappears entirely without JS.

## Global infrastructure (blocks everything below)

- [ ] **Add a `<noscript>` fallback** in `app/layout.tsx` / `app/(app)/layout.tsx`
      explaining that JavaScript is required and listing the routes that still
      work read-only.
- [ ] **Adopt a submission strategy** for no-JS forms. Pick one and apply
      consistently:
  - Server Actions with `<form action={fn}>` (progressive enhancement by
    default), or
  - Native `<form action="/api/...">` + a server route that redirects/renders.
- [ ] **Expose server-side counterparts** for the XHR-only client methods in
      `api/client/method/**` that back core forms.
- [ ] **Audit `<form>` elements** to carry real `action`/`method` and named
      inputs, so a native submit is meaningful.
- [ ] **Decide the minimum no-JS write set** (suggested: login, submit code,
      reply, answer preliminary) vs. read-only-only surfaces.

## P0 — Core path (blocking)

- [ ] **Login** — `/login`
  - Files: `features/auth/login/login-page.tsx`, `app/(public)/(auth)/login/page.tsx`.
  - Problem: `onSubmit` + `ClientApis.Auth.login` (XHR, `login-page.tsx:85`);
    route wraps the client page in `Suspense fallback={null}`
    (`app/(public)/(auth)/login/page.tsx:13`).
  - Target: native POST to a server route (or Server Action) with
    `action` + named `uname`/`password`/`rememberme`, redirect on success.

- [ ] **Submit problem code** — `/problem/[pid]/submit`
  - Files: `features/problem/submit/problem-submit-form.tsx`,
    `features/problem/submit/problem-submit-form-client.tsx`,
    `api/client/method/problem/submit.ts`.
  - Problem: code editor (`ssr: false`) + `onSubmit` XHR only.
  - Target: `<noscript>` textarea fallback with `name`, native POST to a submit
    route.

- [ ] **Sudo re-authentication** — `/user/sudo`
  - Files: `features/auth/sudo/sudo-page.tsx`,
    `features/auth/sudo/sudo-confirmation.tsx`,
    `features/auth/sudo/verify-security-key.ts`.
  - Problem: WebAuthn/TOTP/password handled entirely client-side.
  - Target: native password POST path that works without WebAuthn support.

## P1 — Core regular-user write paths

- [ ] **Preliminary answer save/submit** — `/preliminary/[paperId]`
  - Files: `features/preliminary/detail/preliminary-answer-provider.tsx`,
    `features/preliminary/detail/preliminary-submit-bar.tsx`,
    `api/client/method/preliminary/{save,submit}.ts`.
  - Problem: answers held in IndexedDB drafts; submit via XHR.
  - Target: native form POST per section (or Server Action), draft restore on
    server-rendered values.

- [ ] **Objective problem answer submit** — `/problem/[pid]` (objective variant)
  - Files: `features/problem/objective/provider.tsx`,
    `features/problem/objective/submit-button.tsx`,
    `features/problem/objective/controls.tsx`.
  - Target: native radio/checkbox inputs with names + POST fallback.

- [ ] **Discussion reply** — `/discussion/[did]`
  - Files: `features/discussion/detail/discussion-replies-client.tsx`,
    `api/client/method/discussion/reply.ts`.
  - Target: native `<form action>` reply box; server-render the reply list
    (already server-rendered) as the fallback view.

- [ ] **Account settings** — `/home/settings/account`
  - Files: `features/account/settings/account-settings-form.tsx`,
    `features/account/settings/avatar-settings.tsx`,
    `features/account/settings/setting-field.tsx`,
    `api/client/method/account/settings.ts`.
  - Problem: profile/bio/password/avatar mutations are client-only; bio uses the
    client-only Markdown editor.
  - Target: native form POST + `<noscript>` textarea for bio.

- [ ] **Real-name submission** — `/home/realname`
  - Files: `features/realname/user/realname-form.tsx`,
    `api/client/method/realname/index.ts`.
  - Target: native form POST with named fields.

- [ ] **Send message** — `/home/messages`
  - Files: `features/message/message-page.tsx`,
    `api/client/method/messages/send.ts`.
  - Problem: recipient picker, thread state and send are all client.
  - Target: server-rendered thread + native reply form.

- [ ] **Daily check-in** — `/home` (homepage widget)
  - Files: `features/homepage/components/daily-checkin.tsx`,
    `api/client/method/checkin/index.ts`.
  - Target: native POST button; server-rendered checked-in state.

- [ ] **Enrollment / registration actions**
  - `features/contest/detail/contest-sidebar.tsx` (contest registration)
  - `features/homework/detail/homework-sidebar.tsx`
  - `features/training/detail/training-sidebar.tsx`,
    `api/client/method/training/enroll.ts`
  - Target: native POST with redirect back to the page.

## P2 — Regular-user authoring & discovery

- [ ] **Contest authoring** — `/contest/create`, `/contest/[tid]/edit`
  - Files: `features/contest/create/contest-create-form.tsx`,
    `features/contest/edit/contest-edit-form.tsx`,
    `features/contest/form/contest-form.tsx`.
- [ ] **Homework authoring** — `/homework/create`, `/homework/[tid]/edit`
  - Files: `features/homework/create/homework-create-form.tsx`,
    `features/homework/edit/homework-edit-form.tsx`,
    `features/homework/form/homework-form.tsx`.
- [ ] **Training authoring** — `/training/create`, `/training/[tid]/edit`
  - Files: `features/training/create/training-create-form.tsx`,
    `features/training/edit/training-edit-form.tsx`,
    `features/training/form/training-form.tsx`.
- [ ] **Preliminary authoring** — `/preliminary/create`,
      `/preliminary/[paperId]/edit`
  - Files: `features/preliminary/create/preliminary-create-form.tsx`,
    `features/preliminary/edit/preliminary-edit-form.tsx`,
    `features/preliminary/lib/use-delete-preliminary.ts`.
- [ ] **Problem authoring** — `/problem/create`, `/problem/import/[format]`,
      `/problem/[pid]/edit`
  - Files: `features/problem/create/problem-create-form.tsx`,
    `features/problem/create/problem-import-form.tsx`,
    `features/problem/edit/problem-edit-form.tsx`,
    `features/problem/form/problem-form.tsx`.
- [ ] **Problem solutions** — `/problem/[pid]/solution/create`,
      `/problem/[pid]/solution/[psid]/edit`, vote/delete on solution list
  - Files: `features/problem/solution/solution-create-form.tsx`,
    `features/problem/solution/solution-vote.tsx`,
    `features/problem/solution/solution-delete-button.tsx`.
- [ ] **Paste authoring** — `/paste`, `/paste/[id]/edit`
  - Files: `features/paste/create/paste-create-form.tsx`,
    `features/paste/edit/paste-edit-form.tsx`,
    `features/paste/edit/paste-delete-button.tsx`,
    `features/paste/form/paste-form.tsx`.
- [ ] **List filters → native GET forms**
  - `features/problem/list/problem-search.tsx` (input has no `name`)
  - `features/contest/list/contest-filter.tsx`
  - `features/homework/list/homework-filter.tsx`
  - `features/training/list/training-filter.tsx`
  - `features/preliminary/list/preliminary-filter.tsx`
  - `features/discussion/list/discussion-node-filter.tsx`
  - `features/record/list/record-filter.tsx`
  - Target: `<form method="get">` with named inputs so filtering works without
    JS; keep client behavior as an enhancement.
- [ ] **App shell interactions**
  - `features/navigation/sidebar-user-menu.tsx` (theme, logout)
  - `features/navigation/omnibar.tsx`, `omnibar-trigger.tsx` (global search)
  - `features/navigation/collapsed-trigger.tsx`,
    `shared/components/ui/sidebar.tsx` (mobile/sidebar toggling)
  - Target: ensure logout and theme are reachable via server-rendered links;
    mark omnibar as enhancement.

## P3 — Admin / management / advanced tooling

- [ ] **Contest management** — `/contest/[tid]/management`, `.../clarification`,
      `.../balloon`, `.../bulk-submit`, `.../user`
  - Files: `features/contest/management/*`.
- [ ] **Real-name review** — `/manage/realname`
  - Files: `features/realname/manage/realname-review-list.tsx`,
    `features/realname/manage/realname-review-filter.tsx`.
- [ ] **Account expiration** — `/manage/user-expiration`
  - Files: `features/account-expiration/expiration-page.tsx`,
    `features/account-expiration/expiration-action-dialog.tsx`,
    `features/account-expiration/expiration-filter.tsx`.
- [ ] **Problem config workspace** — `/problem/[pid]/config`
  - Files: `features/problem/config/problem-config-workspace.tsx` and tabs.
- [ ] **Problem files manager** — `/problem/[pid]/files`
  - Files: `features/problem/files/problem-files-manager.tsx`,
    `features/problem/files/create-file-dialog.tsx`,
    `features/problem/files/rename-file-dialog.tsx`.
- [ ] **AI test data generation** — `/problem/[pid]/generate`
  - Files: `features/problem/generate/ai-generation-form.tsx`.
- [ ] **Record operations** — `/record/[rid]`
  - Files: `features/record/detail/record-detail-live.tsx`,
    `features/record/detail/record-sidebar.tsx` (rejudge/cancel).
- [ ] **Scratchpad** — `/problem/[pid]` provider
  - Files: `features/problem/scratchpad/scratchpad-provider.tsx`,
    `features/problem/scratchpad/scratchpad-workspace.tsx`.
  - Note: purely additive tool; decide whether a no-JS fallback is required.

## P4 — Enhancements missing content fallback

- [ ] **Code editor** — `shared/components/code/code-editor.tsx` (`ssr: false`)
  - Add a `<noscript>`/server-rendered `<textarea>` fallback.
- [ ] **Markdown editor** — `shared/components/markdown-editor/index.tsx`
      (`mounted` gate, `index.tsx:53,96`)
  - Add a `<noscript>` textarea fallback; expose the raw value server-side.
- [ ] **Math formulas** —
      `shared/components/markdown/katex-client-render.tsx`
  - Without JS, render original TeX text instead of an empty slot.
- [ ] **PDF viewer** —
      `shared/components/markdown/components/markdown-pdf.tsx` (`ssr: false`)
  - Provide a direct download link as the no-JS fallback.

## Already acceptable (document only, no action)

These are additive realtime/progressive features whose absence is a valid
degradation:

- Realtime updates: `shared/hooks/use-record-socket.ts`,
  `features/record/list/record-list-live.tsx`,
  `features/record/detail/record-detail-live.tsx`,
  `features/message/message-realtime-provider.tsx`.
- Client-side calculators/auto-complete: `features/language/language-auto-complete.tsx`,
  `features/problem/problem-auto-complete.tsx`,
  `features/user/auto-complete.tsx`.
- Existing guarded feature detection: `ResizeObserver` guards
  (`features/contest/contest-timer.tsx:63`,
  `features/preliminary/detail/preliminary-submit-bar.tsx:35`),
  `BroadcastChannel` guard (`features/message/message-realtime-provider.tsx:134`),
  `visualViewport` optional chaining (`features/auth/login/login-page.tsx:48-49`).

## Suggested sequencing

1. Global `<noscript>` + pick the submission strategy (Server Action vs native
   `action`).
2. P0: login → submit code → sudo.
3. P1 in order: preliminary → objective submit → discussion reply → account →
   realname → messages → enrollment → check-in.
4. P2 filters (native GET) first, then authoring forms.
5. P3/P4 as capacity allows.

## Verification

- Add an end-to-end pass with JavaScript disabled (Playwright
  `javaScriptEnabled: false`) covering the P0 and agreed P1 paths.
- Assert core pages render usable HTML and core forms submit/redirect.

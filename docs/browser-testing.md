# Browser rendering tests

## Decision

Use Vitest Browser Mode (`@vitest/browser-playwright`) with Chromium and
`vitest-browser-react`. Browser tests load `app/globals.css` through the existing
PostCSS/Tailwind pipeline, including typography, theme tokens, and component CSS
imports. They run in a real browser, with real layout, media queries, focus, and
pointer input. The Vite test server starts automatically; no Next.js or backend
server is needed for component tests.

Keep the existing jsdom suite during migration. Its config retains server-only
aliases and CodSpeed integration; neither is inherited by the browser config.
Browser tests must not import server implementation code. Keep pure logic and
server contracts in unit tests; a later migration can move pure tests to Node.
Browser component tests do not reproduce Next.js routing, async Server Components,
font compilation, or production CSS chunk order. Verify those through application
E2E tests against a built Next.js app.

## Commands

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm test                    # Existing suite, then browser suite
pnpm test:unit               # Existing suite only
pnpm test:browser            # Headless Chromium
pnpm test:browser:watch      # Interactive browser debugging
pnpm test:browser:update     # Deliberately update screenshot baselines
```

Colocate browser tests as `*.browser.test.tsx` (or `.ts`). The two configurations
have disjoint file patterns so a browser test never silently runs in jsdom.
`pnpm test:watch` continues to watch the existing unit suite; use the browser watch
command when migrating rendering tests. Benchmarks retain `pnpm bench`.

## Test contracts

Start with a requirement that describes the result a user needs. Locate elements
by role, label, or text, interact through Vitest browser locators, and await
`expect.element(...)` or `expect.poll(...)` for asynchronous results.

| Previous assertion                | Browser result to verify                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `toHaveClass('hidden')`           | Element is not visible at the required viewport                                           |
| Responsive class exists           | Resize with `page.viewport`; verify visibility and bounds at both sides of the breakpoint |
| Text color class exists           | `getComputedStyle(element).color` matches the design requirement                          |
| Width or overflow class exists    | Bounds fit their container; `scrollWidth <= clientWidth` where overflow must not occur    |
| Scroll or focus method was called | Actual focused element and final viewport position                                        |
| Dialog state attribute exists     | Dialog appears, receives focus, can be used, and closes with focus restored               |

Use `getBoundingClientRect()` for relative alignment, containment, size, and
clipping. Visibility alone does not prove an element is unobscured, inside the
viewport, or correctly styled. Use a real click for hit testing where relevant.
Keep tolerances explicit and small for fractional layout. Do not derive expected
values from the same implementation constants under test. Accessible attributes
remain valid contracts when testing accessibility; they do not prove appearance.

`features/problem/problem-difficulty.browser.test.tsx` demonstrates real component
rendering with light/dark themes, computed foreground/background colors, and text
containment, while `features/user/profile/components/checkin-heatmap.browser.test.tsx`
shows grid/layout, tooltip, and keyboard coverage.

## Isolation and boundaries

The setup imports production CSS and unmounts rendered React trees after each
test, before resetting the dark class and viewport. This releases portals, focus
traps, and scroll locks before changing the shared document. Browser files run
with at most two workers. Defaults are 1280×720, scale factor 1, UTC,
English locale, light color scheme, and reduced motion. Tests that change other
global state must restore it. Avoid concurrent tests sharing a document.

Wrap components with the real providers they need, such as
`NextIntlClientProvider`. Keep fixtures and wrappers feature-local until multiple
features need exactly the same helper. Mock network/navigation boundaries only as
needed; do not mock the component's layout primitives, styles, ResizeObserver,
matchMedia, focus, or scrolling. Browser module mocks must use factory exports;
Node-only module spying patterns may need rewriting.

The browser config defines `process.env` because Next.js client components read
it at module scope (`next/image` reads `process.env.__NEXT_IMAGE_OPTS`). It also
dedupes `react`/`react-dom` so prebundled component libraries (for example
`@base-ui/react`) share the same React instance as `vitest-browser-react`. Do not
add `next/navigation` to `optimizeDeps.exclude`: real imports of that CJS module
lose their named exports, while `vi.mock('next/navigation', factory)` works with
the default dependency optimizer.

Reduced motion is a browser preference, not a blanket animation disable. Wait for
the required final state rather than sleeping. Tests specifically covering motion
must explicitly configure and restore that preference.

## Migration status

Migrated to `*.browser.test.tsx` (jsdom copies removed): contest status, timers,
and scoreboard cells; problem difficulty/status, titles, lists, and auto-complete;
problem status icons, objective navigation, scratchpad provider, and testdata
uploads; record lists, filters, code and auto-complete widgets; check-in heatmap;
management sidebar and real-name review filter/result/form; language and user
auto-completes; paste language select, history, detail actions, and code content;
preliminary mobile navigation; theme logo; ranking leaderboard; async
auto-complete; login page; sudo page; and the confirm/delete dialogs. Pure helpers
split out of those files stay as `*.test.ts` (for example
`features/manage/manage-access.test.ts`).

Suites that only describe server route composition or internal prop forwarding
(no rendering contract to assert) intentionally remain on jsdom. The rest are
still tracked by `vitest.config.mts`; migrate them in batches by the sequence
below and keep `pnpm test` green between batches.

## Screenshot regressions

For complex appearance, supplement explicit result assertions with:

```ts
await expect(page.getByRole('region', { name: 'Preview' })).toMatchScreenshot(
  'preview'
);
```

Commit reviewed reference images under the default `__screenshots__` directories.
Never ignore those directories. Failure screenshots go to `test-results/browser`;
Vitest comparison attachments go to `test-results/attachments`. CI uploads both.
Generated failure artifacts are ignored by Git and Prettier.

Generate and compare references using the same pinned Playwright version, OS,
fonts, viewport, and headless mode as CI. Before adopting screenshot baselines,
standardize that environment (for example a pinned Playwright container) and load
local fonts explicitly when typography matters. Next.js font transforms do not
run in Vite. Do not approve an arbitrary first capture as the intended design or
raise mismatch thresholds to hide a regression. CI must compare existing images,
never run the update command. This initial harness uses portable geometry/style
assertions and does not introduce unreviewed pixel baselines.

## Migration sequence

1. Prioritize responsive visibility, overflow, Markdown typography, dialogs, and
   layout tests currently asserting classes or mocked geometry.
2. Move each selected test to the browser suffix, replace rendering/input helpers,
   retain its meaningful user scenarios, and replace implementation assertions
   with explicit rendering contracts. Remove the superseded jsdom test only when
   equivalent meaningful coverage passes.
3. Prove the new test detects a deliberate style regression while keeping the
   original class present. Restore the mutation immediately after verification.
4. Add reviewed screenshots only for appearance that explicit assertions cannot
   adequately describe. Expand browser engines only when compatibility becomes a
   requirement.
5. Remove jsdom after all DOM-dependent tests migrate; retain fast pure/server tests.

## References

- https://v4.vitest.dev/guide/browser/
- https://v4.vitest.dev/api/browser/react
- https://v4.vitest.dev/guide/browser/visual-regression-testing
- Installed Next.js guide: `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`

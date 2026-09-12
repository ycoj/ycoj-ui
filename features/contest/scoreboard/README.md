# Scoreboard image exports

`GET /scoreboard-export/:pageType/:tid` is handled by Next.js in the Node.js
runtime. `pageType` is `contest` or `homework`; `tid` is a 24-digit hexadecimal
ObjectId. Optional `avatar`, `realName`, and `details` query parameters accept
`true` or `false` and default to `false`.

The route forwards the current user's cookies through the existing server API
client. Normal PNG exports load the default scoreboard. Real-name or detail
exports load Hydro's permission-checked `scoreboard/export-data` view. The route
never accepts a client-supplied user dictionary or submission history.

The response is an `image/png` attachment, or an `application/zip` attachment
containing `scoreboard.png` for the complete standings plus one PNG per
participant when `details=true`. Filenames include UID so participants with the
same name have distinct files. Private responses use `Cache-Control: private,
no-store`; backend permission failures do not render an image.

Every error response body is `{ error: string }`. Invalid parameters return 400.
Backend failures map by Hydro error name: `NotFound` returns 404,
`Permission`/`Privilege`/`Forbidden`/`Hidden` return 403, and anything else
returns 502. Exports that exceed a participant, byte, or pixel limit return 413
with a localized explanation instead of a generic failure. Exports that hit the
deadline return 504, and exports rejected because the process is already
rendering the maximum number of concurrent exports return 503 with
`Retry-After`. Unexpected rendering failures return 500. The client shows the
server-provided message and falls back to a generic error only when no message
is available.

Both data sources use the page scoreboard columns and score/first-solve metadata.
Problem headers include their titles regardless of the real-name option. The image
uses the page’s score colors, first-solve balloons, and horizontal row separators.
The client anchors export options to the toolbar button and displays a modal until
the download is ready, reopening the options with an error on failure.

## Rendering and limits

SVG layout and rasterization run on the server using `@resvg/resvg-js`, and
JSZip packages the PNG buffers on the server. The client downloads the resulting
blob; it does not render tables or images and does not package the ZIP. Each
individual image is limited to 40 million pixels and a detail ZIP retains at
most 64 MiB of PNG data.

Rendering is sequential within one export, and a process renders at most
`MAX_CONCURRENT_EXPORTS = 2` exports at once, since each details export holds a
render thread and hundreds of MiB for minutes. The cap is per process: every
Node.js instance or replica enforces its own limit, so the effective capacity is
`2 × instances`. Capacity is checked when rendering starts; saturated requests
are rejected with 503 without queueing.

A 4-way concurrency experiment on 13 representative detail images measured 86s
versus 107s sequential (1.24x) while peak RSS rose from ~305MiB to ~394MiB, so
images inside one export stay sequential.

The limits are sized from measurements on a 2-core i5-6200U laptop with
`assets/fonts/NotoSansCJKsc-Regular.otf` and representative 12-column data
(colored, multi-line record cells, 20 submissions per participant). The
committed bench reproduces the overview sizes and the single participant image:

`SCOREBOARD_EXPORT_BENCH=1 pnpm exec vitest bench --run features/contest/scoreboard/scoreboard-export-renderer.bench.ts`

| workload                              | time  | peak RSS |
| ------------------------------------- | ----- | -------- |
| overview, 60 participants             | ~24s  | ~180MiB  |
| overview, 120 participants            | ~46s  | ~370MiB  |
| overview, 180 participants            | ~69s  | ~510MiB  |
| one participant image, 20 submissions | ~8.5s | —        |
| 12-participant detail set, 13 images  | ~107s | ~305MiB  |
| same detail set, 4-way concurrency    | ~86s  | ~394MiB  |

Peak RSS and the sequential-versus-concurrent detail-set comparison come from a
one-off measurement script, not the committed bench, which reports timings only.

The per-image cost is dominated by text shaping (~30ms per text run), so detail
ZIPs are the expensive path: each participant adds one image. The export
deadline is 300 seconds. Detail exports accept at most 20 participants
(overview plus 20 images is roughly three minutes measured). Plain PNG
overviews accept up to 250 participants; the 40-million-pixel cap rejects
extremely large tables sooner. Request cancellation is checked between images
and forwarded to rendering, avatar fetches, and ZIP finalization.

### Proxy timeouts

An export can hold the response for up to `EXPORT_DEADLINE_MS` (300 seconds)
before the generated file is available. Reverse proxies and CDNs in front of the
route must allow at least that long for `/scoreboard-export/*`: for nginx set
`proxy_read_timeout 300s;` and `proxy_send_timeout 300s;` (or the CDN
equivalent). The route buffers the file, so the timeout applies to the wait
before the first response byte.

Deploy with Node.js and the platform-specific optional dependency installed by
pnpm. No Chromium installation is required. The font lives in `assets/fonts/`
so it is not web-served; `next.config.ts` includes it in route output tracing
and `assets/fonts/README.md` records the no-subsetting decision. Fonts are
local; avatars are fetched only when requested, using the existing fixed avatar
providers. Failed avatar fetches omit the avatar and preserve the export.

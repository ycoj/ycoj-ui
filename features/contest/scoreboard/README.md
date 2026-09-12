# Scoreboard image exports

`GET /api/scoreboard-export/:pageType/:tid` is handled by Next.js in the Node.js
runtime. `pageType` is `contest` or `homework`; `tid` is a 24-digit hexadecimal
ObjectId. Optional `avatar`, `realName`, and `details` query parameters accept
`true` or `false` and default to `false`.

The route forwards the current user's cookies through the existing server API
client. Normal PNG exports load the default scoreboard. Real-name or detail
exports load Hydro's permission-checked `scoreboard/export-data` view. The route
never accepts a client-supplied user dictionary or submission history.

The response is an `image/png` attachment, or an `application/zip` attachment
containing one PNG per participant when `details=true`. Filenames include UID
so participants with the same name have distinct files. Private responses use
`Cache-Control: private, no-store`; backend permission failures do not render an
image. Invalid parameters return 400; rendering failures return 500.

SVG layout and rasterization run on the server using `@resvg/resvg-js`, and
JSZip packages the PNG buffers on the server. The client downloads the resulting
blob; it does not render tables or images and does not package the ZIP. Each
participant is rasterized sequentially to avoid simultaneous full-size canvases.
Each individual image is limited to 40 million pixels. An export is limited to
250 participants, detail ZIPs retain at most 64 MiB of PNG data, and the whole
export has a 60-second deadline. Oversized or expired exports return 500.
Request cancellation is checked between images and forwarded to rendering and
avatar fetches.

Deploy with Node.js and the platform-specific optional dependency installed by
pnpm. No Chromium installation is required. Keep
`public/fonts/NotoSansCJKsc-Regular.otf` and its license with the deployment;
`next.config.ts` includes the font in route output tracing. Fonts are local;
avatars are fetched only when requested, using the existing fixed avatar
providers. Failed avatar fetches omit the avatar and preserve the export.

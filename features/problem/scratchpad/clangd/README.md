# Optional browser C++ language server

Scratchpad settings default to ordinary editing. Enabling the C++ language server
runs clangd in a dedicated browser worker, with completion, hover and diagnostics
attached only to the active scratchpad model. There is no backend LSP service.
Closing the scratchpad, disabling the language server or switching away from a
supported C++ standard disposes the connection, providers, diagnostics and
workers.

## Deployment

`pnpm build` runs `pnpm prepare:clangd` before Next.js. This verifies the pinned
runtime already checked into `public/clangd/v2/`; both the JavaScript loader and
Wasm binary are tracked with Git LFS. The build does not download Clangd assets.
Keep this directory in deployments and serve `/clangd/` from the same origin as
the application. No LLVM compilation takes place during the build. To verify
assets for a development environment, run `pnpm prepare:clangd` explicitly.

The source is the [clangd-in-browser project](https://github.com/guyutongxue/clangd-in-browser).
Checksums in `scripts/prepare-clangd.mjs` pin the JavaScript and Wasm snapshot.
The preparation script limits its pthread pool to four workers; clangd uses two
analysis threads. When updating the snapshot, update the checksums and versioned
asset directory together, then update the matching runtime paths in
`.gitattributes`, the lint and formatter ignore files,
`public/clangd/worker.mjs`, `scripts/clangd-smoke.mjs`,
`scripts/prepare-clangd.mjs` and `next.config.ts`. The versioned cache header
must move with the runtime so immutable URLs never serve an older snapshot.
License notices ship under `public/clangd/`.

The page needs a secure context and cross-origin isolation. `next.config.ts`
applies COOP `same-origin` and COEP `credentialless` to `/problem/*?clangd=1`
and the worker assets. The opt-in button saves the current draft before a full
navigation and reopens the scratchpad. Ordinary page requests do not receive
these isolation headers. Reverse proxies must retain the query string and the
headers. Cross-origin CORS requests (including fonts and module scripts) still
need suitable CORS responses from their CDN. Test the actual CDN deployment.

## Resource and compiler limits

- The Wasm asset is 126,550,863 bytes before HTTP compression. Enable gzip or
  Brotli at the static host/CDN. Versioned assets are cached for a year.
- The runtime reserves 2 GiB of shared Wasm memory and can grow to 4 GiB. Browser
  memory reporting is approximate, not a measurement of available RAM. Devices
  reporting less than 8 GiB are gated out; browsers without that API can opt in
  after reading the resource notice. Failed startup or stalled requests fall
  back to ordinary editing. A browser process killed by the OS cannot be caught
  by JavaScript.
- Analysis uses the selected supported C++ standard, a Wasm target and bundled
  libc++ headers. It cannot exactly reproduce a native GCC judge environment.
  A standard-header `bits/stdc++.h` shim is provided; GNU PBDS is not included.
  Unknown compiler identifiers keep ordinary editing rather than guessing flags.

## Verification

Run `pnpm lint`, `pnpm format:check`, `pnpm lint:type` and `pnpm test`.
`node scripts/clangd-smoke.mjs` serves a standalone browser smoke test on
`http://127.0.0.1:4179`; it does not start the app or contact its backend.
Open it in a compatible browser and expect `PASS` for initialization, STL
completion, hover, Unicode framing and a deliberate type error.

For end-to-end checks in the app, enable the language server from scratchpad settings,
type a `std::vector<int>` example, invoke completion after `values.`, use
Ctrl+K Ctrl+I on a variable and F8 on a deliberate type error. Check that disabling
the language server removes diagnostics and preserves the code. Also check language
switching, reopening the scratchpad and the save/reload opt-in path.

The patched Wasm transport waits before each header line and body read. Its stdin
adapter must preserve these three chunks, with a null read boundary between
them. Passing the whole frame as one chunk lets stdio read ahead and then wait
forever for data already in its own buffer. The regression test exercises this
contract in addition to UTF-8 byte framing.

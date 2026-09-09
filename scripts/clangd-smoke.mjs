import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

// Serve only the runtime and this test page; no application or backend is started.
const html = `<!doctype html><title>clangd Wasm smoke test</title><pre id="result">Starting…</pre>
<script type="module">
const output = document.querySelector('#result');
const worker = new Worker('/clangd/worker.mjs', { type: 'module' });
const pending = new Map();
let id = 0;
let resolveReady;
let rejectReady;
let resolveDiagnostics;
const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
const diagnosticResult = new Promise(resolve => { resolveDiagnostics = resolve; });
const notify = (method, params) => worker.postMessage({ type: 'rpc', message: { jsonrpc: '2.0', method, params } });
const request = (method, params) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  worker.postMessage({ type: 'rpc', message: { jsonrpc: '2.0', id, method, params } });
});
worker.onmessage = ({ data }) => {
  if (data.type === 'stderr') { console.log(String.fromCharCode(data.byte)); }
  if (data.type === 'ready') resolveReady();
  if (data.type === 'failed') { output.textContent = 'Worker failed'; rejectReady(new Error('Worker failed')); }
  if (data.type !== 'rpc') return;
  const message = data.message;
  if (pending.has(message.id)) {
    const handler = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
  }
  if (message.method === 'textDocument/publishDiagnostics' && message.params.version === 2) resolveDiagnostics(message.params.diagnostics);
};
worker.onerror = event => {
  output.textContent = 'Worker error: ' + event.message;
  rejectReady(new Error(event.message));
  for (const handler of pending.values()) handler.reject(new Error(event.message));
};
async function run() {
  if (!crossOriginIsolated) throw new Error('Page is not isolated');
  worker.postMessage({ type: 'start', standard: 'gnu++17', debug: true });
  await ready;
  output.textContent = 'Runtime ready; initializing LSP…';
  const initialized = await request('initialize', { processId: null, rootUri: 'file:///workspace', capabilities: { general: { positionEncodings: ['utf-16'] }, textDocument: { publishDiagnostics: { versionSupport: true } } } });
  notify('initialized', {});
  output.textContent = 'LSP initialized; checking semantic features…';
  const uri = 'file:///workspace/main.cpp';
  const text = '#include <bits/stdc++.h> // 中文🙂\\nint main() {\\n  std::vector<int> values;\\n  values.push_back(1);\\n  int answer = values[0];\\n}';
  notify('textDocument/didOpen', { textDocument: { uri, languageId: 'cpp', version: 1, text } });
  const hover = await request('textDocument/hover', { textDocument: { uri }, position: { line: 4, character: 7 } });
  if (!hover || !JSON.stringify(hover).includes('int')) throw new Error('Missing semantic hover');
  const completion = await request('textDocument/completion', { textDocument: { uri }, position: { line: 3, character: 9 } });
  if (!JSON.stringify(completion).includes('push_back')) throw new Error('Missing vector completion');
  notify('textDocument/didChange', { textDocument: { uri, version: 2 }, contentChanges: [{ text: text.replace('values[0]', '"bad"') }] });
  const diagnostics = await diagnosticResult;
  if (!diagnostics.some(item => item.severity === 1 && item.range.start.line === 4)) throw new Error('Missing type error');
  return { server: initialized.serverInfo, hover, completionCount: (completion.items ?? completion).length, diagnostics };
}
Promise.race([run(), new Promise((_, reject) => setTimeout(() => reject(new Error('Smoke test timed out')), 120000))])
  .then(result => { output.textContent = 'PASS\\n' + JSON.stringify(result, null, 2); })
  .catch(error => { output.textContent = 'FAIL\\n' + error.stack; })
  .finally(() => { worker.postMessage({ type: 'stop' }); setTimeout(() => worker.terminate(), 100); });
</script>`;

const server = createServer(async (request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/') {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(html);
    return;
  }
  const allowed =
    /^\/clangd\/(worker\.mjs|lsp-stream\.mjs|v1\/clangd\.(js|wasm))$/;
  if (!allowed.test(pathname)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(
      new URL(`../public${pathname}`, import.meta.url)
    );
    response.setHeader(
      'Content-Type',
      pathname.endsWith('.wasm') ? 'application/wasm' : 'text/javascript'
    );
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(Number(process.env.CLANGD_SMOKE_PORT ?? 4179), '127.0.0.1', () =>
  console.log('Open http://127.0.0.1:4179 for the clangd smoke test.')
);

import { StdinStream, MessageDecoder } from './lsp-stream.mjs';

const children = new Set();
const NativeWorker = globalThis.Worker;
globalThis.Worker = class extends NativeWorker {
  constructor(...args) {
    super(...args);
    children.add(this);
  }
};

function stop() {
  for (const worker of children) worker.terminate();
  children.clear();
  globalThis.close();
}

function fail() {
  globalThis.postMessage({ type: 'failed' });
  stop();
}

const input = new StdinStream();
let started = false;
let debug = false;

globalThis.onmessage = (event) => {
  if (event.data.type === 'stop') return stop();
  if (event.data.type === 'start' && !started) {
    started = true;
    debug = event.data.debug === true;
    void start(event.data.standard).catch(fail);
  } else if (event.data.type === 'rpc') {
    input.enqueue(event.data.message);
  }
};

async function start(standard) {
  // Keep in sync with getClangdStandard in
  // features/problem/scratchpad/clangd/clangd-support.ts.
  if (!/^gnu\+\+(98|11|14|17|20|23|26)$/.test(standard)) {
    throw new Error('Unsupported C++ standard');
  }
  const { default: Clangd } = await import('./v2/clangd.js');
  const decoder = new MessageDecoder((message) => {
    globalThis.postMessage({ type: 'rpc', message });
  });
  const clangd = await Clangd({
    thisProgram: '/usr/bin/clangd',
    stdinReady: () => input.ready(),
    stdin: () => input.read(),
    stdout: (byte) => {
      try {
        decoder.push(byte);
      } catch {
        fail();
      }
    },
    stderr: (byte) => {
      if (debug) globalThis.postMessage({ type: 'stderr', byte });
    },
    onAbort: fail,
    onExit: fail,
  });
  clangd.FS.mkdir('/workspace');
  clangd.FS.writeFile('/workspace/main.cpp', '');
  clangd.FS.writeFile(
    '/workspace/.clangd',
    JSON.stringify({
      CompileFlags: {
        Add: [
          '-xc++',
          `-std=${standard}`,
          '--target=wasm32-wasi',
          '-isystem/usr/include/c++/v1',
          '-isystem/usr/include/wasm32-wasi/c++/v1',
          '-isystem/usr/include',
          '-isystem/usr/include/wasm32-wasi',
        ],
      },
      Index: { Background: 'Skip' },
    })
  );
  // libc++ does not ship GCC's convenience header. Only standard headers are included.
  clangd.FS.mkdir('/usr/include/bits');
  clangd.FS.writeFile(
    '/usr/include/bits/stdc++.h',
    [
      'algorithm',
      'array',
      'bitset',
      'cassert',
      'cctype',
      'cerrno',
      'cfloat',
      'climits',
      'cmath',
      'complex',
      'cstdio',
      'cstdlib',
      'cstring',
      'ctime',
      'deque',
      'exception',
      'fstream',
      'functional',
      'iomanip',
      'ios',
      'iosfwd',
      'iostream',
      'istream',
      'iterator',
      'limits',
      'list',
      'map',
      'memory',
      'new',
      'numeric',
      'ostream',
      'queue',
      'set',
      'sstream',
      'stack',
      'stdexcept',
      'streambuf',
      'string',
      'typeinfo',
      'utility',
      'valarray',
      'vector',
    ]
      .filter((name) => standard !== 'gnu++98' || name !== 'array')
      .map((name) => `#include <${name}>`)
      .join('\n') +
      '\n#if __cplusplus >= 201103L\n#include <unordered_map>\n#include <unordered_set>\n#include <tuple>\n#include <random>\n#include <chrono>\n#include <type_traits>\n#endif\n'
  );
  clangd.callMain([
    '-j=2',
    '--background-index=0',
    '--clang-tidy=0',
    '--log=error',
    '--limit-results=100',
  ]);
  globalThis.postMessage({ type: 'ready' });
}

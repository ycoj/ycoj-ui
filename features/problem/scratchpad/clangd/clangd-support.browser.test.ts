import {
  CLANGD_ISOLATION_PARAM,
  SCRATCHPAD_OPEN_PARAM,
  getClangdReloadUrl,
  getClangdStandard,
  getClangdSupport,
  getClangdWorkerUrl,
} from './clangd-support';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('clangd browser support', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value: true,
    });
    vi.stubGlobal('Worker', class {});
    vi.stubGlobal('SharedArrayBuffer', class {});
    vi.stubGlobal('WebAssembly', { Memory: class {} });
    vi.stubGlobal('navigator', { deviceMemory: 8 });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    // Drop the own-property overrides so the real browser values return.
    Reflect.deleteProperty(window, 'isSecureContext');
    Reflect.deleteProperty(window, 'crossOriginIsolated');
    window.history.replaceState(null, '', '/');
  });

  it('accepts shared Wasm memory and sufficient reported RAM', () => {
    expect(getClangdSupport()).toBe('supported');
  });
  it('keeps low-memory devices in ordinary mode', () => {
    vi.stubGlobal('navigator', { deviceMemory: 4 });
    expect(getClangdSupport()).toBe('lowMemory');
  });
  it('allows explicit opt-in when the browser does not expose memory size', () => {
    vi.stubGlobal('navigator', {});
    expect(getClangdSupport()).toBe('supported');
  });
  it('requires a reload for a document without isolation and avoids reload loops', () => {
    Object.defineProperty(window, 'crossOriginIsolated', {
      configurable: true,
      value: false,
    });
    expect(getClangdSupport()).toBe('reload');
    window.history.replaceState(
      null,
      '',
      `/problem/P1?${CLANGD_ISOLATION_PARAM}=1`
    );
    expect(getClangdSupport()).toBe('unsupported');
  });
  it('rejects browsers without workers or secure contexts', () => {
    vi.stubGlobal('Worker', undefined);
    expect(getClangdSupport()).toBe('unsupported');
    vi.stubGlobal('Worker', class {});
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    expect(getClangdSupport()).toBe('unsupported');
  });
  it('rejects browsers that cannot create shared Wasm memory', () => {
    vi.stubGlobal('WebAssembly', {
      Memory: class {
        constructor() {
          throw new Error('Unsupported');
        }
      },
    });
    expect(getClangdSupport()).toBe('unsupported');
  });
});

describe('clangd compiler selection', () => {
  it.each([
    ['cc.cc14o2', 'gnu++14'],
    ['cc.cc17', 'gnu++17'],
    ['cc.cc2bo2', 'gnu++23'],
    ['cc.cc03', 'gnu++98'],
    ['py.py3', undefined],
    ['cc.custom', undefined],
  ])('maps %s without guessing unknown toolchains', (language, expected) => {
    expect(getClangdStandard(language)).toBe(expected);
  });
  it('preserves contest context and fragments when enabling isolation', () => {
    const url = new URL(
      getClangdReloadUrl('https://ycoj.cc/problem/P1?tid=contest#sample')
    );
    expect(url.searchParams.get('tid')).toBe('contest');
    expect(url.searchParams.get(CLANGD_ISOLATION_PARAM)).toBe('1');
    expect(url.searchParams.get(SCRATCHPAD_OPEN_PARAM)).toBe('1');
    expect(url.hash).toBe('#sample');
  });
});

describe('clangd asset URLs', () => {
  it('loads the worker from the configured CDN prefix', () => {
    vi.stubEnv('NEXT_PUBLIC_CLANGD_ASSET_PREFIX', 'https://next-cdn.ycoj.cc/');

    expect(getClangdWorkerUrl()).toBe(
      'https://next-cdn.ycoj.cc/clangd/worker.mjs'
    );
  });

  it('uses the application origin when no CDN prefix is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_CLANGD_ASSET_PREFIX', '');

    expect(getClangdWorkerUrl()).toBe('/clangd/worker.mjs');
  });
});

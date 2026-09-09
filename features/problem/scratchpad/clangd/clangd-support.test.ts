import {
  getClangdReloadUrl,
  getClangdStandard,
  getClangdSupport,
} from './clangd-support';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('clangd browser support', () => {
  beforeEach(() => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('crossOriginIsolated', true);
    vi.stubGlobal('Worker', class {});
    vi.stubGlobal('navigator', { deviceMemory: 8 });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
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
    vi.stubGlobal('crossOriginIsolated', false);
    expect(getClangdSupport()).toBe('reload');
    window.history.replaceState(null, '', '/problem/P1?clangd=1');
    expect(getClangdSupport()).toBe('unsupported');
  });
  it('rejects browsers without workers or secure contexts', () => {
    vi.stubGlobal('Worker', undefined);
    expect(getClangdSupport()).toBe('unsupported');
    vi.stubGlobal('Worker', class {});
    vi.stubGlobal('isSecureContext', false);
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
    expect(url.searchParams.get('clangd')).toBe('1');
    expect(url.searchParams.get('scratchpad')).toBe('1');
    expect(url.hash).toBe('#sample');
  });
});

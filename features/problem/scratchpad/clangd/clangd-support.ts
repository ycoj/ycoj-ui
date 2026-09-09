export type ClangdSupport =
  'supported' | 'reload' | 'unsupported' | 'lowMemory';
export type ClangdStatus = 'loading' | 'ready' | 'failed';

export function getClangdSupport(): ClangdSupport {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    typeof Worker === 'undefined' ||
    typeof WebAssembly === 'undefined'
  ) {
    return 'unsupported';
  }
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (memory !== undefined && memory < 8) return 'lowMemory';
  if (!window.crossOriginIsolated) {
    return new URL(window.location.href).searchParams.get('clangd') === '1'
      ? 'unsupported'
      : 'reload';
  }
  if (typeof SharedArrayBuffer === 'undefined') return 'unsupported';
  try {
    new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
  } catch {
    return 'unsupported';
  }
  return 'supported';
}

export function getClangdStandard(language: string): string | undefined {
  const version =
    /^(?:cc|cpp)\.(?:cc|cpp)(98|03|11|14|17|20|23|26|2a|2b|2c)(?:o2)?$/.exec(
      language
    )?.[1];
  if (!version) return undefined;
  const aliases: Record<string, string> = {
    '03': '98',
    '2a': '20',
    '2b': '23',
    '2c': '26',
  };
  return `gnu++${aliases[version] ?? version}`;
}

export function getClangdReloadUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set('clangd', '1');
  url.searchParams.set('scratchpad', '1');
  return url.href;
}

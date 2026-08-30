export class SudoRedirectError extends Error {
  constructor() {
    super('Redirecting to identity verification.');
    this.name = 'SudoRedirectError';
  }
}

export const SUDO_REQUIRED_EVENT = 'ycoj:sudo-required';

export function navigateToSudo(): never {
  window.dispatchEvent(new Event(SUDO_REQUIRED_EVENT));
  throw new SudoRedirectError();
}

export function safeSudoPath(value: string, origin: string) {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol))
      return null;
    if (url.pathname === '/user/sudo') return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

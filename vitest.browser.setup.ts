import { beforeAll } from 'vitest';

if (!('process' in globalThis)) {
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    value: { env: import.meta.env },
  });
}

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
  writable: true,
});

beforeAll(() => {
  window.addEventListener(
    'error',
    (event) => {
      if (!event.message.includes('ResizeObserver loop')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
});

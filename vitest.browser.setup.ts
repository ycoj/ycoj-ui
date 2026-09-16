import { beforeAll } from 'vitest';

// Client code reads process.env.NEXT_PUBLIC_*, which does not exist in a
// real browser; expose vite's import.meta.env under the same name.
if (!('process' in globalThis)) {
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    value: { env: import.meta.env },
  });
}

// Testing Library's act() requires this flag to flush React updates in tests.
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  value: true,
  writable: true,
});

beforeAll(() => {
  // ResizeObserver loop errors are benign but surface as unhandled errors
  // that fail the browser run; suppress only those.
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

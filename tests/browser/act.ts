// `vitest-browser-react` enables `IS_REACT_ACT_ENVIRONMENT` only around its own
// render, rerender, and unmount helpers, so calling the bare `act` exported by
// `react` outside those windows makes React log "not configured to support
// act(...)". This helper mirrors the library's flag handling for manual act
// calls, e.g. when driving state updates with fake timers or mocked callbacks.
import { act as reactAct } from 'react';

export async function act<T>(callback: () => T | Promise<T>): Promise<T> {
  const reactGlobal = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previous = reactGlobal.IS_REACT_ACT_ENVIRONMENT;
  reactGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    return await reactAct(callback);
  } finally {
    reactGlobal.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

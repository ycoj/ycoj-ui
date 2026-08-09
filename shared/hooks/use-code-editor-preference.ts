import { useCallback, useSyncExternalStore } from 'react';

export const CODE_EDITOR_STORAGE_KEY = 'ycoj.submit.use-code-editor';

type Listener = () => void;

const listeners = new Set<Listener>();

function readStoredPreference(): boolean {
  return window.localStorage.getItem(CODE_EDITOR_STORAGE_KEY) !== '0';
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

/**
 * Remembers whether the user prefers the rich code editor (Monaco) over the
 * plain textarea on the problem submit page. Defaults to the code editor.
 *
 * Backed by `useSyncExternalStore`, so the server snapshot (code editor on)
 * keeps SSR and hydration consistent while the stored preference applies on
 * the client.
 */
export function useCodeEditorPreference(): [
  enabled: boolean,
  setEnabled: (enabled: boolean) => void,
] {
  const enabled = useSyncExternalStore(
    subscribe,
    readStoredPreference,
    () => true
  );

  const updateEnabled = useCallback((next: boolean) => {
    window.localStorage.setItem(CODE_EDITOR_STORAGE_KEY, next ? '1' : '0');
    emitChange();
  }, []);

  return [enabled, updateEnabled];
}

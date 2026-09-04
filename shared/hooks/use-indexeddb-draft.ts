import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type IndexedDbDraftOperations<T> = {
  load: (id: string) => Promise<T | null>;
  save: (id: string, value: T) => Promise<void>;
  clear: (id: string) => Promise<void>;
};

export type UseIndexedDbDraftOptions<T> = IndexedDbDraftOperations<T> & {
  // Maps raw stored state to the answers exposed to consumers and persisted.
  sanitize: (stored: T) => T;
  isReadOnly: boolean;
  initial?: T;
};

export type UseIndexedDbDraftResult<T> = {
  answers: T;
  setAnswer: (id: string, value: T[keyof T]) => void;
  clearAnswers: () => Promise<void>;
  isReady: boolean;
  draftError: boolean;
};

// Shared IndexedDB draft sync for record-shaped drafts: guarded loading with
// cancellation, referentially-guarded saves, and read-only-guarded mutations.
// Sanitizing stays with callers because each draft validates against its own
// questions; loading stores raw payloads so late-registered questions can
// still validate drafts fetched before they were known.
export function useIndexedDbDraft<V>(
  draftId: string,
  {
    load,
    save,
    clear,
    sanitize,
    isReadOnly,
    initial = {} as Record<string, V>,
  }: UseIndexedDbDraftOptions<Record<string, V>>
): UseIndexedDbDraftResult<Record<string, V>> {
  const [storedAnswers, setStoredAnswers] = useState<Record<string, V>>(() => ({
    ...initial,
  }));
  const [isReady, setIsReady] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const lastSavedRef = useRef<Record<string, V>>({ ...initial });

  const answers = useMemo(
    () => sanitize(storedAnswers),
    [storedAnswers, sanitize]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof indexedDB === 'undefined' || indexedDB === null)
          throw new Error('no idb');
        const stored = await load(draftId);
        if (!cancelled && stored && typeof stored === 'object') {
          lastSavedRef.current = stored;
          setStoredAnswers(stored);
        }
      } catch {
        if (!cancelled) setDraftError(true);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, load]);

  useEffect(() => {
    if (!isReady) return;
    if (answers === lastSavedRef.current) return;
    lastSavedRef.current = answers;
    save(draftId, answers).catch(() => setDraftError(true));
  }, [answers, draftId, isReady, save]);

  const setAnswer = useCallback(
    (id: string, value: V) => {
      if (isReadOnly) return;
      setStoredAnswers((prev) => ({ ...prev, [id]: value }));
    },
    [isReadOnly]
  );

  const clearAnswers = useCallback(async () => {
    if (isReadOnly) return;
    setStoredAnswers({});
    try {
      await clear(draftId);
    } catch {
      setDraftError(true);
    }
  }, [clear, draftId, isReadOnly]);

  return { answers, setAnswer, clearAnswers, isReady, draftError };
}

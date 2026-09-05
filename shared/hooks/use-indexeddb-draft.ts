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
  // False while sanitize inputs are still registering (e.g. objective
  // questions parsed from the statement). Persists nothing until ready so a
  // draft loaded before its questions does not clear itself.
  isSanitizeReady?: boolean;
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
    isSanitizeReady = true,
  }: UseIndexedDbDraftOptions<Record<string, V>>
): UseIndexedDbDraftResult<Record<string, V>> {
  const [storedAnswers, setStoredAnswers] = useState<Record<string, V>>(() => ({
    ...initial,
  }));
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState(false);
  const lastSavedRef = useRef<Record<string, V>>({ ...initial });
  const [initialSnapshot] = useState<Record<string, V>>(() => ({
    ...initial,
  }));
  const isReady = loadedDraftId === draftId;

  const answers = useMemo(
    () => sanitize(storedAnswers),
    [storedAnswers, sanitize]
  );

  useEffect(() => {
    let cancelled = false;
    const resetState: Record<string, V> = { ...initialSnapshot };
    lastSavedRef.current = resetState;
    (async () => {
      if (!cancelled) {
        setStoredAnswers(resetState);
        setDraftError(false);
      }
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
        if (!cancelled) setLoadedDraftId(draftId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, initialSnapshot, load]);

  useEffect(() => {
    if (!isReady) return;
    if (isReadOnly) return;
    if (!isSanitizeReady) return;
    if (answers === lastSavedRef.current) return;
    if (Object.keys(answers).length === 0) {
      if (Object.keys(lastSavedRef.current).length === 0) return;
      lastSavedRef.current = answers;
      clear(draftId).catch(() => setDraftError(true));
      return;
    }
    lastSavedRef.current = answers;
    save(draftId, answers).catch(() => setDraftError(true));
  }, [answers, clear, draftId, isReady, isReadOnly, isSanitizeReady, save]);

  const setAnswer = useCallback(
    (id: string, value: V) => {
      if (isReadOnly) return;
      setStoredAnswers((prev) => ({ ...prev, [id]: value }));
    },
    [isReadOnly]
  );

  const clearAnswers = useCallback(async () => {
    if (isReadOnly) return;
    const empty: Record<string, V> = {};
    lastSavedRef.current = empty;
    setStoredAnswers(empty);
    try {
      await clear(draftId);
    } catch {
      setDraftError(true);
    }
  }, [clear, draftId, isReadOnly]);

  return { answers, setAnswer, clearAnswers, isReady, draftError };
}

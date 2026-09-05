import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type IndexedDbDraftOperations<V> = {
  load: (id: string) => Promise<Record<string, V> | null>;
  save: (id: string, value: Record<string, V>) => Promise<void>;
  clear: (id: string) => Promise<void>;
};

export type UseIndexedDbDraftOptions<V> = IndexedDbDraftOperations<V> & {
  // Maps raw stored state to the answers exposed to consumers and persisted.
  //
  // Contract: the result may be the input reference (when nothing changed)
  // or a fresh object. The hook compares the sanitized result against the
  // last persisted value by shallow key/value equality, so a fresh-but-equal
  // object never triggers a redundant save. Callers should still return the
  // input reference when unchanged to skip downstream re-renders.
  sanitize: (stored: Record<string, V>) => Record<string, V>;
  isReadOnly: boolean;
  initial?: Record<string, V>;
  // False while sanitize inputs are still registering (e.g. objective
  // questions parsed from the statement). Persists nothing until ready so a
  // draft loaded before its questions does not clear itself.
  isSanitizeReady?: boolean;
};

export type UseIndexedDbDraftResult<V> = {
  answers: Record<string, V>;
  setAnswer: (id: string, value: V) => void;
  clearAnswers: () => Promise<void>;
  isReady: boolean;
  draftError: boolean;
};

function draftValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => Object.is(item, b[index]))
    );
  }
  return false;
}

// Compares sanitized drafts by value (not reference) so callers may return a
// fresh-but-equal object from sanitize without causing a save loop.
function shallowEqualDrafts<V>(
  a: Record<string, V>,
  b: Record<string, V>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => draftValuesEqual(a[key], b[key]))
  );
}

// Shared IndexedDB draft sync for record-shaped drafts: guarded loading with
// cancellation, value-compared saves, and read-only-guarded mutations.
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
    initial = {},
    isSanitizeReady = true,
  }: UseIndexedDbDraftOptions<V>
): UseIndexedDbDraftResult<V> {
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
    if (shallowEqualDrafts(answers, lastSavedRef.current)) return;
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

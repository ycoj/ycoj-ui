'use client';

import { clearDraft, getDraft, saveDraft } from './draft-storage';
import { getDraftId, isAnswerCompleted } from './draft-utils';
import type { ObjectiveAnswers } from './types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ObjectiveContextValue = {
  answers: ObjectiveAnswers;
  setAnswer: (id: string, value: string | string[]) => void;
  isReady: boolean;
  isReadOnly: boolean;
  draftError: boolean;
  questionIds: string[];
  registerQuestion: (id: string) => void;
  clearAnswers: () => Promise<void>;
  isCompleted: (id: string) => boolean;
  hasAnyQuestion: boolean;
};

const ObjectiveContext = createContext<ObjectiveContextValue | null>(null);

export function useObjective() {
  const ctx = useContext(ObjectiveContext);
  if (!ctx)
    throw new Error('useObjective must be used within ObjectiveProvider');
  return ctx;
}

export function useOptionalObjective() {
  return useContext(ObjectiveContext);
}

type ProviderProps = {
  children: ReactNode;
  userId: number | string | null;
  domainId: string;
  problemDocId: number;
  tid?: string | null;
  eventKind: 'standalone' | 'contest' | 'homework';
  isReadOnly: boolean;
};

export default function ObjectiveProvider({
  children,
  userId,
  domainId,
  problemDocId,
  tid,
  eventKind,
  isReadOnly,
}: ProviderProps) {
  const [answers, setAnswers] = useState<ObjectiveAnswers>({});
  const [isReady, setIsReady] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const questionSetRef = useRef<Set<string>>(new Set());
  const draftId = useMemo(
    () => getDraftId(userId, domainId, problemDocId, eventKind, tid),
    [userId, domainId, problemDocId, eventKind, tid]
  );

  const firstReadyRef = useRef(false);
  const readyDraftIdRef = useRef<string | null>(null);

  useEffect(() => {
    setAnswers({});
    setQuestionIds([]);
    questionSetRef.current = new Set<string>();
    setDraftError(false);
    setIsReady(false);
    firstReadyRef.current = false;
    readyDraftIdRef.current = null;

    let cancelled = false;
    (async () => {
      try {
        if (typeof indexedDB === 'undefined' || indexedDB === null)
          throw new Error('no idb');
        const stored = await getDraft(draftId);
        if (!cancelled && stored && typeof stored === 'object') {
          setAnswers(stored);
        }
      } catch {
        if (!cancelled) setDraftError(true);
      } finally {
        if (!cancelled) {
          readyDraftIdRef.current = draftId;
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  useEffect(() => {
    if (!isReady) return;
    if (readyDraftIdRef.current !== draftId) return;
    if (!firstReadyRef.current) {
      firstReadyRef.current = true;
      return;
    }
    saveDraft(draftId, answers).catch(() => setDraftError(true));
  }, [answers, draftId, isReady]);

  const registerQuestion = useCallback((id: string) => {
    if (questionSetRef.current.has(id)) return;
    questionSetRef.current.add(id);
    setQuestionIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const setAnswer = useCallback(
    (id: string, value: string | string[]) => {
      if (isReadOnly) return;
      setAnswers((prev) => ({ ...prev, [id]: value }));
    },
    [isReadOnly]
  );

  const clearAnswers = useCallback(async () => {
    setAnswers({});
    try {
      await clearDraft(draftId);
    } catch {
      setDraftError(true);
    }
  }, [draftId]);

  const isCompleted = useCallback(
    (id: string) => isAnswerCompleted(answers[id]),
    [answers]
  );

  const value = useMemo<ObjectiveContextValue>(
    () => ({
      answers,
      setAnswer,
      isReady,
      isReadOnly,
      draftError,
      questionIds,
      registerQuestion,
      clearAnswers,
      isCompleted,
      hasAnyQuestion: questionIds.length > 0,
    }),
    [
      answers,
      setAnswer,
      isReady,
      isReadOnly,
      draftError,
      questionIds,
      registerQuestion,
      clearAnswers,
      isCompleted,
    ]
  );

  return (
    <ObjectiveContext.Provider value={value}>
      {children}
    </ObjectiveContext.Provider>
  );
}

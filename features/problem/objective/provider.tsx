'use client';

import {
  clearDraft,
  getDraft,
  saveDraft,
} from '@/features/problem/objective/draft-storage';
import { isAnswerCompleted } from '@/features/problem/objective/draft-utils';
import {
  sanitizeAnswers,
  type ObjectiveQuestion,
} from '@/features/problem/objective/question-schema';
import type { ObjectiveAnswers } from '@/features/problem/objective/types';
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
  questions: ObjectiveQuestion[];
  questionIds: string[];
  registerQuestion: (question: ObjectiveQuestion) => () => void;
  clearAnswers: () => Promise<void>;
  isCompleted: (id: string) => boolean;
};

const ObjectiveContext = createContext<ObjectiveContextValue | null>(null);

export function useObjective() {
  const ctx = useContext(ObjectiveContext);
  if (!ctx)
    throw new Error('useObjective must be used within ObjectiveProvider');
  return ctx;
}

type ProviderProps = {
  children: ReactNode;
  draftId: string;
  isReadOnly: boolean;
};

export default function ObjectiveProvider({
  children,
  draftId,
  isReadOnly,
}: ProviderProps) {
  const [storedAnswers, setStoredAnswers] = useState<ObjectiveAnswers>({});
  const [isReady, setIsReady] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>([]);
  const lastSavedRef = useRef<ObjectiveAnswers>({});

  // Answers exposed to consumers always match the questions parsed from the
  // current statement; removed, re-typed, or stale-option entries are dropped.
  const answers = useMemo(
    () => sanitizeAnswers(storedAnswers, questions),
    [storedAnswers, questions]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof indexedDB === 'undefined' || indexedDB === null)
          throw new Error('no idb');
        const stored = await getDraft(draftId);
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
  }, [draftId]);

  useEffect(() => {
    if (!isReady) return;
    if (answers === lastSavedRef.current) return;
    lastSavedRef.current = answers;
    saveDraft(draftId, answers).catch(() => setDraftError(true));
  }, [answers, draftId, isReady]);

  const registerQuestion = useCallback((question: ObjectiveQuestion) => {
    setQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) return prev;
      return [...prev, question];
    });
    return () => {
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
    };
  }, []);

  const setAnswer = useCallback(
    (id: string, value: string | string[]) => {
      if (isReadOnly) return;
      setStoredAnswers((prev) => ({ ...prev, [id]: value }));
    },
    [isReadOnly]
  );

  const clearAnswers = useCallback(async () => {
    if (isReadOnly) return;
    setStoredAnswers({});
    try {
      await clearDraft(draftId);
    } catch {
      setDraftError(true);
    }
  }, [draftId, isReadOnly]);

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);

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
      questions,
      questionIds,
      registerQuestion,
      clearAnswers,
      isCompleted,
    }),
    [
      answers,
      setAnswer,
      isReady,
      isReadOnly,
      draftError,
      questions,
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

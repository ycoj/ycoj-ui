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
import { useIndexedDbDraft } from '@/shared/hooks/use-indexeddb-draft';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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
  const [questions, setQuestions] = useState<ObjectiveQuestion[]>([]);

  // Answers exposed to consumers always match the questions parsed from the
  // current statement; removed, re-typed, or stale-option entries are dropped.
  const sanitize = useCallback(
    (stored: ObjectiveAnswers) => sanitizeAnswers(stored, questions),
    [questions]
  );
  const { answers, setAnswer, clearAnswers, isReady, draftError } =
    useIndexedDbDraft(draftId, {
      load: getDraft,
      save: saveDraft,
      clear: clearDraft,
      sanitize,
      isReadOnly,
    });

  const registerQuestion = useCallback((question: ObjectiveQuestion) => {
    setQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) return prev;
      return [...prev, question];
    });
    return () => {
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
    };
  }, []);

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

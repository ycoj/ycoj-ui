'use client';

import {
  clearDraft,
  getDraft,
  saveDraft,
} from '@/features/preliminary/detail/draft-storage';
import { useIndexedDbDraft } from '@/shared/hooks/use-indexeddb-draft';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

type PreliminaryAnswerContextValue = {
  answers: PreliminaryAnswers;
  setAnswer: (questionId: string, value: string) => void;
  clearAnswers: () => Promise<void>;
  answeredCount: number;
  totalCount: number;
  isReady: boolean;
  isReadOnly: boolean;
  draftError: boolean;
  isAnswered: (questionId: string) => boolean;
};

const PreliminaryAnswerContext =
  createContext<PreliminaryAnswerContextValue | null>(null);

export function usePreliminaryAnswers() {
  const ctx = useContext(PreliminaryAnswerContext);
  if (!ctx)
    throw new Error(
      'usePreliminaryAnswers must be used within PreliminaryAnswerProvider'
    );
  return ctx;
}

export function sanitizeDraft(
  stored: PreliminaryAnswers,
  allowed: Record<string, string[]>
): PreliminaryAnswers {
  const result: PreliminaryAnswers = {};
  for (const [questionId, value] of Object.entries(stored)) {
    const options = allowed[questionId];
    if (options && options.includes(value)) result[questionId] = value;
  }
  return result;
}

type ProviderProps = {
  children: ReactNode;
  draftId: string;
  allowedAnswers: Record<string, string[]>;
  isReadOnly: boolean;
};

export default function PreliminaryAnswerProvider({
  children,
  draftId,
  allowedAnswers,
  isReadOnly,
}: ProviderProps) {
  const sanitize = useCallback(
    (stored: PreliminaryAnswers) => sanitizeDraft(stored, allowedAnswers),
    [allowedAnswers]
  );
  const { answers, setAnswer, clearAnswers, isReady, draftError } =
    useIndexedDbDraft(draftId, {
      load: getDraft,
      save: saveDraft,
      clear: clearDraft,
      sanitize,
      isReadOnly,
    });

  const questionIds = useMemo(
    () => Object.keys(allowedAnswers),
    [allowedAnswers]
  );
  const answeredCount = questionIds.filter(
    (id) => answers[id] !== undefined
  ).length;

  const isAnswered = useCallback(
    (questionId: string) => answers[questionId] !== undefined,
    [answers]
  );

  const value = useMemo<PreliminaryAnswerContextValue>(
    () => ({
      answers,
      setAnswer,
      clearAnswers,
      answeredCount,
      totalCount: questionIds.length,
      isReady,
      isReadOnly,
      draftError,
      isAnswered,
    }),
    [
      answers,
      setAnswer,
      clearAnswers,
      answeredCount,
      questionIds.length,
      isReady,
      isReadOnly,
      draftError,
      isAnswered,
    ]
  );

  return (
    <PreliminaryAnswerContext.Provider value={value}>
      {children}
    </PreliminaryAnswerContext.Provider>
  );
}

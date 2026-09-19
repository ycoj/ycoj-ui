'use client';

import { useIndexedDbDraft } from '@/shared/hooks/use-indexeddb-draft';
import {
  DRAFT_DATABASES,
  makeDraftStorage,
} from '@/shared/lib/indexeddb-draft';
import type {
  PreliminaryAnswers,
  PreliminaryProgrammingAnswer,
  PreliminaryProgrammingAnswers,
} from '@/shared/types/preliminary';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

const { getDraft, saveDraft, clearDraft } =
  makeDraftStorage<PreliminaryAnswers>(
    DRAFT_DATABASES.preliminary.dbName,
    DRAFT_DATABASES.preliminary.storeName
  );

// Programming answers persist as their own typed map in a sibling record, so
// code never has to be JSON-smuggled through the objective answer map.
const {
  getDraft: getProgrammingDraft,
  saveDraft: saveProgrammingDraft,
  clearDraft: clearProgrammingDraft,
} = makeDraftStorage<PreliminaryProgrammingAnswers>(
  DRAFT_DATABASES.preliminary.dbName,
  DRAFT_DATABASES.preliminary.storeName
);

type PreliminaryAnswerContextValue = {
  answers: PreliminaryAnswers;
  programmingAnswers: PreliminaryProgrammingAnswers;
  setAnswer: (questionId: string, value: string) => void;
  setProgrammingAnswer: (
    questionId: string,
    answer: PreliminaryProgrammingAnswer
  ) => void;
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
  let changed = false;
  const result: PreliminaryAnswers = {};
  for (const [questionId, value] of Object.entries(stored)) {
    const options = allowed[questionId];
    if (options && options.includes(value)) {
      result[questionId] = value;
    } else {
      changed = true;
    }
  }
  return changed ? result : stored;
}

function isProgrammingAnswerShape(
  answer: unknown
): answer is PreliminaryProgrammingAnswer {
  return (
    !!answer &&
    typeof answer === 'object' &&
    typeof (answer as { lang?: unknown }).lang === 'string' &&
    typeof (answer as { code?: unknown }).code === 'string'
  );
}

export function sanitizeProgrammingDraft(
  stored: PreliminaryProgrammingAnswers,
  questionIds: readonly string[]
): PreliminaryProgrammingAnswers {
  let changed = false;
  const result: PreliminaryProgrammingAnswers = {};
  for (const [questionId, answer] of Object.entries(stored)) {
    if (questionIds.includes(questionId) && isProgrammingAnswerShape(answer)) {
      result[questionId] = answer;
    } else {
      changed = true;
    }
  }
  return changed ? result : stored;
}

type ProviderProps = {
  children: ReactNode;
  draftId: string;
  allowedAnswers: Record<string, string[]>;
  programmingQuestionIds: readonly string[];
  isReadOnly: boolean;
};

export default function PreliminaryAnswerProvider({
  children,
  draftId,
  allowedAnswers,
  programmingQuestionIds,
  isReadOnly,
}: ProviderProps) {
  const sanitize = useCallback(
    (stored: PreliminaryAnswers) => sanitizeDraft(stored, allowedAnswers),
    [allowedAnswers]
  );
  const sanitizeProgramming = useCallback(
    (stored: PreliminaryProgrammingAnswers) =>
      sanitizeProgrammingDraft(stored, programmingQuestionIds),
    [programmingQuestionIds]
  );

  const {
    answers,
    setAnswer,
    clearAnswers: clearObjectiveAnswers,
    isReady: isObjectiveReady,
    draftError: objectiveDraftError,
  } = useIndexedDbDraft(draftId, {
    load: getDraft,
    save: saveDraft,
    clear: clearDraft,
    sanitize,
    isReadOnly,
  });
  const {
    answers: programmingAnswers,
    setAnswer: setProgrammingAnswer,
    clearAnswers: clearProgrammingAnswers,
    isReady: isProgrammingReady,
    draftError: programmingDraftError,
  } = useIndexedDbDraft(`${draftId}#programming`, {
    load: getProgrammingDraft,
    save: saveProgrammingDraft,
    clear: clearProgrammingDraft,
    sanitize: sanitizeProgramming,
    isReadOnly,
  });

  const clearAnswers = useCallback(async () => {
    await clearObjectiveAnswers();
    await clearProgrammingAnswers();
  }, [clearObjectiveAnswers, clearProgrammingAnswers]);

  const questionIds = useMemo(
    () => Object.keys(allowedAnswers),
    [allowedAnswers]
  );
  const answeredCount =
    questionIds.filter((id) => answers[id] !== undefined).length +
    programmingQuestionIds.filter((id) => programmingAnswers[id] !== undefined)
      .length;

  const isAnswered = useCallback(
    (questionId: string) =>
      answers[questionId] !== undefined ||
      programmingAnswers[questionId] !== undefined,
    [answers, programmingAnswers]
  );

  const value = useMemo<PreliminaryAnswerContextValue>(
    () => ({
      answers,
      programmingAnswers,
      setAnswer,
      setProgrammingAnswer,
      clearAnswers,
      answeredCount,
      totalCount: questionIds.length + programmingQuestionIds.length,
      isReady: isObjectiveReady && isProgrammingReady,
      isReadOnly,
      draftError: objectiveDraftError || programmingDraftError,
      isAnswered,
    }),
    [
      answers,
      programmingAnswers,
      setAnswer,
      setProgrammingAnswer,
      clearAnswers,
      answeredCount,
      questionIds.length,
      programmingQuestionIds.length,
      isObjectiveReady,
      isProgrammingReady,
      isReadOnly,
      objectiveDraftError,
      programmingDraftError,
      isAnswered,
    ]
  );

  return (
    <PreliminaryAnswerContext.Provider value={value}>
      {children}
    </PreliminaryAnswerContext.Provider>
  );
}

import type {
  PreliminaryDefinition,
  PreliminaryDefinitionInput,
  PreliminaryQuestionType,
  PreliminarySectionType,
} from '@/shared/types/preliminary';

export type PreliminaryOptionValue = {
  id: string;
  text: string;
};

export type PreliminaryQuestionValue = {
  id: string;
  type: PreliminaryQuestionType;
  prompt: string;
  score: number;
  explanation: string;
  answer: string;
  options: PreliminaryOptionValue[];
};

export type PreliminarySectionValue = {
  id: string;
  type: PreliminarySectionType;
  title: string;
  content: string;
  questions: PreliminaryQuestionValue[];
};

export type PreliminaryFormValues = {
  title: string;
  content: string;
  sections: PreliminarySectionValue[];
};

export const PRELIMINARY_DEFAULT_SCORE = 2;

// Normalizes raw score input at the form boundary (wired via setValueAs on
// the score field): number inputs yield NaN when cleared, which would
// otherwise flow into the payload and fail backend validation.
//
// Behavior change: non-finite input used to survive in form state and was
// silently coerced to the default deep in buildPreliminaryPayload. It is now
// coerced here, so form state, validation, and the payload always agree.
// Draft saving still only validates the title; the score it persists is
// whatever the input boundary normalized.
export function normalizeScoreInput(value: unknown): number {
  // Number('') is 0, so a cleared input needs an explicit blank check;
  // otherwise an empty score would persist as 0 and fail validation.
  if (typeof value === 'string' && value.trim() === '') {
    return PRELIMINARY_DEFAULT_SCORE;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : PRELIMINARY_DEFAULT_SCORE;
}

export function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let hex = '';
    for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, '0');
    }
    return `id-${hex}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newOption(): PreliminaryOptionValue {
  return { id: newId(), text: '' };
}

export function newQuestion(
  type: PreliminaryQuestionType
): PreliminaryQuestionValue {
  if (type === 'true_false') {
    return {
      id: newId(),
      type,
      prompt: '',
      score: PRELIMINARY_DEFAULT_SCORE,
      explanation: '',
      answer: 'true',
      options: [],
    };
  }
  const options = [newOption(), newOption(), newOption(), newOption()];
  return {
    id: newId(),
    type,
    prompt: '',
    score: PRELIMINARY_DEFAULT_SCORE,
    explanation: '',
    answer: options[0].id,
    options,
  };
}

export function newSection(
  type: PreliminarySectionType,
  title: string
): PreliminarySectionValue {
  return {
    id: newId(),
    type,
    title,
    content: '',
    questions: [
      newQuestion(type === 'program_reading' ? 'true_false' : 'choice'),
    ],
  };
}

export function getPreliminaryCreateDefaults(): PreliminaryFormValues {
  return {
    title: '',
    content: '',
    sections: [],
  };
}

export type SectionTypeLabelKey =
  'singleChoice' | 'programReading' | 'programCompletion';

// Single source for the section-type label used by the section card and list.
export function getSectionTypeLabel(
  type: PreliminarySectionType | undefined,
  t: (key: SectionTypeLabelKey) => string
): string {
  if (type === 'program_reading') return t('programReading');
  if (type === 'program_completion') return t('programCompletion');
  return t('singleChoice');
}

export function buildPreliminaryPayload(
  values: PreliminaryFormValues
): PreliminaryDefinitionInput {
  // Trim every free-text field to match the backend text() normalization;
  // the score is trusted as-is because the score input coerces non-finite
  // values at the form boundary (see normalizeScoreInput).
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    sections: values.sections.map((section) => ({
      id: section.id,
      type: section.type,
      title: section.title.trim(),
      content: section.content.trim(),
      questions: section.questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt.trim(),
        score: question.score,
        explanation: (question.explanation ?? '').trim(),
        answer: question.answer,
        options:
          question.type === 'true_false'
            ? []
            : question.options.map((option) => ({
                id: option.id,
                text: option.text.trim(),
              })),
      })),
    })),
  };
}

export function mapPreliminaryEditToFormValues(
  definition: PreliminaryDefinition
): PreliminaryFormValues {
  return {
    title: definition.title ?? '',
    content: definition.content ?? '',
    sections: (definition.sections ?? []).map((section) => ({
      id: section.id || newId(),
      type: section.type,
      title: section.title ?? '',
      content: section.content ?? '',
      questions: (section.questions ?? []).map((question) => ({
        id: question.id || newId(),
        type: question.type,
        prompt: question.prompt ?? '',
        score: question.score ?? PRELIMINARY_DEFAULT_SCORE,
        explanation: question.explanation ?? '',
        answer: question.answer ?? '',
        options: (question.options ?? []).map((option) => ({
          id: option.id || newId(),
          text: option.text ?? '',
        })),
      })),
    })),
  };
}

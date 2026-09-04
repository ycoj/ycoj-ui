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

export function newId(): string {
  return crypto.randomUUID();
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
      score: 2,
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
    score: 2,
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

export function countQuestions(sections: { questions: unknown[] }[]): number {
  return sections.reduce((sum, section) => sum + section.questions.length, 0);
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
  return {
    title: values.title.trim(),
    content: values.content.trim(),
    sections: values.sections.map((section) => ({
      id: section.id,
      type: section.type,
      title: section.title.trim(),
      content: section.content,
      questions: section.questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        score: question.score,
        explanation: question.explanation ?? '',
        answer: question.answer,
        options:
          question.type === 'true_false'
            ? []
            : question.options.map((option) => ({
                id: option.id,
                text: option.text,
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
        score: question.score ?? 2,
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

// Pure helpers for the preliminary training feature.
import {
  PRELIMINARY_TRUE_FALSE_VALUES,
  type PreliminaryQuestion,
} from '@/shared/types/preliminary';

export function getAlphabeticId(index: number): string {
  let result = '';
  let value = index;
  do {
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return result;
}

export function getPreliminaryQuestionAnchorId(questionId: string): string {
  return `question-${questionId}`;
}

// Allow-list of submittable answer values per question, used to sanitize
// restored drafts. True/false questions accept fixed literals; choice
// questions accept their current option ids.
export type AllowedAnswerSection = {
  questions: Pick<PreliminaryQuestion, 'id' | 'type' | 'options'>[];
};

export function buildAllowedAnswers(
  sections: AllowedAnswerSection[]
): Record<string, string[]> {
  const allowed: Record<string, string[]> = {};
  for (const section of sections) {
    for (const question of section.questions) {
      allowed[question.id] =
        question.type === 'true_false'
          ? [...PRELIMINARY_TRUE_FALSE_VALUES]
          : (question.options ?? []).map((option) => option.id);
    }
  }
  return allowed;
}

// Backend numbers are global across sections; fall back to the global index
// (not the per-section index) so numbers never collide across sections.
export function getQuestionDisplayNumber(
  question: { questionNumber?: number },
  globalIndex: number
): number {
  return question.questionNumber ?? globalIndex + 1;
}

export type PreliminaryNavQuestion = {
  id: string;
  number: number;
};

// Pairs each section with its starting global question index so detail and
// review views can number questions with a running index inline, without an
// intermediate id-to-number Map.
export function getPreliminarySectionStarts<T extends { questions: unknown[] }>(
  sections: T[]
): Array<{ section: T; start: number }> {
  let start = 0;
  return sections.map((section) => {
    const current = start;
    start += section.questions.length;
    return { section, start: current };
  });
}

// Single pass over sections in display order; replaces the ad-hoc
// slice/reduce/flatMap variants previously spread across detail views.
export function getPreliminaryNavQuestions(
  sections: Array<{ questions: Array<{ id: string; questionNumber?: number }> }>
): PreliminaryNavQuestion[] {
  const questions: PreliminaryNavQuestion[] = [];
  let globalIndex = 0;
  for (const section of sections) {
    for (const question of section.questions) {
      questions.push({
        id: question.id,
        number: getQuestionDisplayNumber(question, globalIndex),
      });
      globalIndex += 1;
    }
  }
  return questions;
}

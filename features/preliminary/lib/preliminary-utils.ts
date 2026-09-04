// Pure helpers for the preliminary training feature.

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
  questions: {
    id: string;
    type: string;
    options?: { id: string }[];
  }[];
};

export function buildAllowedAnswers(
  sections: AllowedAnswerSection[]
): Record<string, string[]> {
  const allowed: Record<string, string[]> = {};
  for (const section of sections) {
    for (const question of section.questions) {
      allowed[question.id] =
        question.type === 'true_false'
          ? ['true', 'false']
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

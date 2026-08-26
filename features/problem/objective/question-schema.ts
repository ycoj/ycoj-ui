import type { ObjectiveAnswers } from '@/features/problem/objective/types';

export type ObjectiveControlType =
  'input' | 'textarea' | 'dropdown' | 'select' | 'multiselect';

export type ObjectiveQuestion = {
  id: string;
  type: ObjectiveControlType;
  options?: string[];
};

function isAllowedOption(question: ObjectiveQuestion, value: string): boolean {
  if (!question.options || question.options.length === 0) return true;
  return question.options.includes(value);
}

/**
 * Drops draft entries that no longer fit the questions parsed from the
 * current statement: removed questions, answers whose value type does not
 * match the control type, and choice values outside the allowed options.
 * Returns the original object when nothing changed.
 */
export function sanitizeAnswers(
  answers: ObjectiveAnswers,
  questions: readonly ObjectiveQuestion[]
): ObjectiveAnswers {
  const byId = new Map(questions.map((q) => [q.id, q]));
  let changed = false;
  const out: ObjectiveAnswers = {};
  for (const [id, value] of Object.entries(answers)) {
    const question = byId.get(id);
    if (!question) {
      changed = true;
      continue;
    }
    switch (question.type) {
      case 'input':
      case 'textarea':
        if (typeof value === 'string') {
          out[id] = value;
        } else {
          changed = true;
        }
        break;
      case 'dropdown':
      case 'select':
        if (typeof value === 'string' && isAllowedOption(question, value)) {
          out[id] = value;
        } else {
          changed = true;
        }
        break;
      case 'multiselect':
        if (Array.isArray(value)) {
          const valid = value.filter(
            (v) => typeof v === 'string' && isAllowedOption(question, v)
          );
          if (valid.length > 0) {
            out[id] = valid;
            if (valid.length !== value.length) changed = true;
          } else {
            changed = true;
          }
        } else {
          changed = true;
        }
        break;
    }
  }
  return changed ? out : answers;
}

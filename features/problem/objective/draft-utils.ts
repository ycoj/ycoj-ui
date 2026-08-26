import type {
  ObjectiveAnswers,
  ObjectiveEventKind,
} from '@/features/problem/objective/types';

export function isAnswerCompleted(
  value: string | string[] | undefined
): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

export function getDraftId(
  userId: string | number | null,
  domainId: string,
  problemDocId: number,
  kind: ObjectiveEventKind,
  tid: string | null | undefined
): string {
  return JSON.stringify([userId, domainId, problemDocId, kind, tid]);
}

export function serializeAnswersForSubmit(
  answers: ObjectiveAnswers
): ObjectiveAnswers {
  const out: ObjectiveAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'string') {
      if (value.trim() === '') continue;
      out[key] = value;
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = value;
    }
  }
  return out;
}

export function getEventKind(
  tdoc: { rule?: string } | null | undefined
): ObjectiveEventKind {
  if (!tdoc) return 'standalone';
  if (tdoc.rule === 'homework') return 'homework';
  return 'contest';
}

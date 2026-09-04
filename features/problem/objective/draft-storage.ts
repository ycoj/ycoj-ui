import type { ObjectiveAnswers } from '@/features/problem/objective/types';
import { makeDraftStorage } from '@/shared/lib/indexeddb-draft';

// Drafts written before the shared value envelope stored answers under the
// `answers` key; keep them readable, the next save rewrites the envelope.
function migrateLegacyDraft(record: unknown): ObjectiveAnswers | null {
  if (!record || typeof record !== 'object') return null;
  const answers = (record as { answers?: unknown }).answers;
  if (!answers || typeof answers !== 'object') return null;
  return answers as ObjectiveAnswers;
}

export const { getDraft, saveDraft, clearDraft } =
  makeDraftStorage<ObjectiveAnswers>('ycoj-ui', 'objective-drafts', {
    migrate: migrateLegacyDraft,
  });

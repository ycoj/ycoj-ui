import { makeDraftStorage } from '@/shared/lib/indexeddb-draft';
import type { PreliminaryAnswers } from '@/shared/types/preliminary';

export const { getDraft, saveDraft, clearDraft } =
  makeDraftStorage<PreliminaryAnswers>(
    'ycoj-ui-preliminary',
    'preliminary-drafts'
  );

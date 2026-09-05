import {
  DRAFT_DATABASES,
  makeDraftStorage,
} from '@/shared/lib/indexeddb-draft';

export type ScratchpadDraft = {
  code: string;
  language: string;
};

// Drafts written before the shared value envelope stored code and language
// at the top level; keep them readable, the next save rewrites the envelope.
function migrateLegacyDraft(record: unknown): ScratchpadDraft | null {
  if (!record || typeof record !== 'object') return null;
  const { code, language } = record as {
    code?: unknown;
    language?: unknown;
  };
  if (typeof code !== 'string' || typeof language !== 'string') return null;
  return { code, language };
}

const { getDraft, saveDraft } = makeDraftStorage<ScratchpadDraft>(
  DRAFT_DATABASES.scratchpad.dbName,
  DRAFT_DATABASES.scratchpad.storeName,
  { migrate: migrateLegacyDraft }
);

export function getScratchpadDraft(
  id: string
): Promise<ScratchpadDraft | null> {
  return getDraft(id);
}

export function saveScratchpadDraft(
  draft: ScratchpadDraft & { id: string }
): Promise<void> {
  return saveDraft(draft.id, { code: draft.code, language: draft.language });
}

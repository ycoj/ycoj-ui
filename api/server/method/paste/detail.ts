import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { PasteDoc } from '@/shared/types/paste';

export type PasteDetailData = {
  pdoc: PasteDoc;
  canManage: boolean;
  languageNames: Record<string, string>;
};

export const getPasteDetail = (id: string) =>
  alova.Get<Errorable<PasteDetailData>>(`/paste/${encodeURIComponent(id)}`);

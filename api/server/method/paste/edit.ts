import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

export type PasteEditData = PasteFormOptions & { pdoc: PasteDoc };

export const getPasteEdit = (id: string) =>
  alova.Get<Errorable<PasteEditData>>(`/paste/${encodeURIComponent(id)}/edit`);

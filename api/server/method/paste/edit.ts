import { alova } from '@/api/server';
import {
  normalizePasteOptionsResponse,
  type PasteBackendFormFields,
} from '@/api/server/method/paste/normalize';
import type { Errorable } from '@/shared/types/error';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

type PasteEditBackend = PasteBackendFormFields & { pdoc: PasteDoc };

export type PasteEditData = PasteFormOptions & { pdoc: PasteDoc };

export const getPasteEdit = (id: string) =>
  alova.Get<Errorable<PasteEditData>>(`/paste/${encodeURIComponent(id)}/edit`, {
    transform: (data) => normalizePasteOptionsResponse<PasteEditBackend>(data),
  });

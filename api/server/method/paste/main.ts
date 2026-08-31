import { alova } from '@/api/server';
import {
  normalizePasteOptionsResponse,
  type PasteBackendFormFields,
} from '@/api/server/method/paste/normalize';
import type { Errorable } from '@/shared/types/error';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

type PasteMainBackend = PasteBackendFormFields & {
  pdocs: PasteDoc[];
  ppcount: number;
  pcount: number;
  page: number;
};

export type PasteMainData = PasteFormOptions & {
  pdocs: PasteDoc[];
  ppcount: number;
  pcount: number;
  page: number;
};

export const getPasteMain = (page = 1) =>
  alova.Get<Errorable<PasteMainData>>('/paste', {
    params: { page },
    transform: (data) => normalizePasteOptionsResponse<PasteMainBackend>(data),
  });

import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

export type PasteMainData = PasteFormOptions & {
  pdocs: PasteDoc[];
  ppcount: number;
  pcount: number;
  page: number;
};

export const getPasteMain = (page = 1) =>
  alova.Get<Errorable<PasteMainData>>('/paste', {
    params: { page },
  });

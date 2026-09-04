import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  PreliminaryDefinition,
  PreliminaryPaperSummary,
} from '@/shared/types/preliminary';

export type PreliminaryEditData = {
  page_name: 'preliminary_create' | 'preliminary_edit';
  paper: PreliminaryPaperSummary | null;
  definition: PreliminaryDefinition;
};

export type PreliminaryEditResponse = Errorable<PreliminaryEditData>;

export const getPreliminaryCreate = () =>
  alova.Get<PreliminaryEditResponse>('/preliminary/create');

export const getPreliminaryEdit = (paperId: string) =>
  alova.Get<PreliminaryEditResponse>(`/preliminary/${paperId}/edit`);

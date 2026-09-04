import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  PreliminaryAttemptSummary,
  PreliminaryDefinition,
  PreliminaryPaperSummary,
} from '@/shared/types/preliminary';
import type { BaseUser, BaseUserDict } from '@/shared/types/user';

// title/content come from the summary only; sections come from the definition.
export type PreliminaryPublicPaper = PreliminaryPaperSummary &
  Pick<PreliminaryDefinition, 'sections'>;

export type PreliminaryDetailData = {
  paper: PreliminaryPublicPaper;
  attempts: PreliminaryAttemptSummary[];
  owner: BaseUser;
  udict?: BaseUserDict;
  canEdit: boolean;
  canSubmit: boolean;
};

export type PreliminaryDetailResponse = Errorable<PreliminaryDetailData>;

export const getPreliminaryDetail = (paperId: string) =>
  alova.Get<PreliminaryDetailResponse>(`/preliminary/${paperId}`);

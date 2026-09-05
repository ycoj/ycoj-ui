import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  PreliminaryAttemptSummary,
  PreliminaryPaperSummary,
  PreliminaryQuestion,
  PreliminarySection,
} from '@/shared/types/preliminary';
import type { BaseUser } from '@/shared/types/user';

// The public detail never includes answer keys or explanations (see
// toPublicPreliminaryDefinition in YCOJ lib/preliminary.ts).
export type PublicPreliminaryQuestion = Omit<
  PreliminaryQuestion,
  'answer' | 'explanation'
>;

export type PublicPreliminarySection = Omit<PreliminarySection, 'questions'> & {
  questions: PublicPreliminaryQuestion[];
};

// title/content come from the summary only; sections come from the definition.
export type PreliminaryPublicPaper = PreliminaryPaperSummary & {
  sections: PublicPreliminarySection[];
};

export type PreliminaryDetailData = {
  paper: PreliminaryPublicPaper;
  attempts: PreliminaryAttemptSummary[];
  owner: BaseUser;
  canEdit: boolean;
  canSubmit: boolean;
};

export type PreliminaryDetailResponse = Errorable<PreliminaryDetailData>;

export const getPreliminaryDetail = (paperId: string) =>
  alova.Get<PreliminaryDetailResponse>(`/preliminary/${paperId}`);

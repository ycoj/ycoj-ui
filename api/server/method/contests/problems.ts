import { alova } from '@/api/server';
import type {
  Contest,
  ContestClarificationDoc,
  ContestStatus,
} from '@/shared/types/contest';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { BaseUserDict } from '@/shared/types/user';

export type ProblemDict = Record<number, ProblemDoc>;

export type ContestProblemsResponse = {
  pdict: ProblemDict;
  psdict: Record<number, { rid: string }>;
  udict: BaseUserDict;
  rdict: Record<string, RecordDoc>;
  tdoc: Contest;
  tcdocs: ContestClarificationDoc[];
  showScore?: boolean;
  tsdoc?: ContestStatus;
  canViewRecord?: boolean;
  rdocs?: RecordDoc[];
  correction?: Record<string, { rid: string }>;
};

export const getContestProblems = (tid: string) =>
  alova.Get<ContestProblemsResponse>(`/contest/${tid}/problems`);

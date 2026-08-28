import { clientRequest } from '@/api/client';
import type { ContestRule } from '@/shared/types/contest';
import type { ObjectId } from '@/shared/types/shared';

export type CreateContestRequest = {
  operation: 'update';
  beginAtDate: string;
  beginAtTime: string;
  duration: number;
  title: string;
  content: string;
  rule: Exclude<ContestRule, 'homework'>;
  pids: string;
  rated: boolean;
  code?: string;
  autoHide: boolean;
  assign?: string[];
  lock?: number;
  contestDuration?: number;
  maintainer?: number[];
  allowViewCode: boolean;
  allowPrint: boolean;
  keepScoreboardHidden: boolean;
  langs?: string[];
};

export type CreateContestResponse = {
  tid: ObjectId;
};

export const createContest = (payload: CreateContestRequest) =>
  clientRequest.Post<CreateContestResponse>('/contest/create', payload);

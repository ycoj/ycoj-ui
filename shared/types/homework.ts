import type { BaseContest } from './contest';

export type Homework = {
  rule: 'homework';
  penaltySince?: Date;
  penaltyRules?: Record<string, number>;
} & BaseContest;

export type HomeworkStatus = {
  _id: string;
  domainId: string;
  docId: string;
  docType: number;
  uid: number;
  journal: Array<{
    rid: string;
    pid: number;
    status?: number;
    score?: number;
    subtasks?: unknown;
    lang?: string;
  }>;
  score: number;
  penaltyScore: number;
  time: number;
  detail: Record<
    number,
    { rid: string; pid: number; penaltyScore: number; time: number }
  >;
  attend?: boolean;
  startAt?: Date;
};

export type HomeworkProblemStatusDict = Record<
  number,
  {
    rid: string;
    pid: number;
    score?: number;
    status?: number;
    penaltyScore?: number;
    time?: number;
  }
>;

import type { DiscussionReplyDoc } from './discussion';
import { FileInfo } from './file';
import { ObjectId } from './shared';

export type ProblemStatus = {
  _id: ObjectId;
  docId: number;
  docType: 10;
  domainId: string;
  rid?: ObjectId;
  score?: number;
  status?: number;
  nSubmit?: number;
  nAccept?: number;
  star?: boolean;
};

// Key is pdoc.docId (problem id).
export type ProblemStatusDict = Record<string, ProblemStatus>;

export type ContestListProjectionProblem = {
  _id: string;
  domainId: string;
  docType: 10;
  docId: number;
  pid: string;
  owner: number;
  title: string;
  blacklist?: number[];
};

export type ListProjectionProblem = ContestListProjectionProblem & {
  nSubmit: number;
  nAccept: number;
  difficulty?: number;
  tag: string[];
  hidden?: boolean;
  stats?: Record<string, number>;
  rejectSolution?: boolean;
};

export interface ProblemConfig {
  redirect?: [string, string];
  count: number;
  memoryMax: number;
  memoryMin: number;
  timeMax: number;
  timeMin: number;
  langs?: string[];
  type: string;
  subType?: string;
  target?: string;
  hackable?: boolean;
}

export type ContestDetailProjectionProblem = ContestListProjectionProblem & {
  content: string;
  html?: boolean;
  data: FileInfo[];
  config: ProblemConfig;
  additional_file: FileInfo[];
  reference?: {
    domainId: string;
    pid: number;
  };
  llmKeyword?: string;
};

export type PublicProjectionProblem = ListProjectionProblem &
  ContestDetailProjectionProblem;

export type ProblemDoc = PublicProjectionProblem;

export type SolutionDoc = {
  _id: ObjectId;
  docId: ObjectId;
  docType: number;
  domainId: string;
  owner: number;
  content: string;
  parentId: number;
  parentType: number;
  reply: DiscussionReplyDoc[];
  vote: number;
};

import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSolutionDoc = {
  _id: ObjectId;
  docId: ObjectId;
  domainId: string;
  parentId: number;
  owner: number;
  content: string;
  status: number;
  vote: number;
};

export type ProblemSolutionEditResponse = {
  psdoc: ProblemSolutionDoc;
};

export const editProblemSolution = (
  pid: number,
  psid: ObjectId,
  content: string
) =>
  clientRequest.Post<ProblemSolutionEditResponse>(`/p/${pid}/solution`, {
    psid,
    content,
    operation: 'edit_solution',
  });

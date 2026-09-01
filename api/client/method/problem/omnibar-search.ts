import { clientRequest } from '@/api/client';
import type {
  ListProjectionProblem,
  ProblemStatusDict,
} from '@/shared/types/problem';

export type OmnibarProblemSearchResponse = {
  pdocs: ListProjectionProblem[];
  psdict: ProblemStatusDict;
};

export const searchOmnibarProblems = (query: string) =>
  clientRequest.Get<OmnibarProblemSearchResponse>('/d/system/p', {
    params: {
      q: query,
      limit: 10,
    },
  });

import { clientRequest } from '@/api/client';
import type {
  ListProjectionProblem,
  ProblemStatusDict,
} from '@/shared/types/problem';

// The new UI migration currently targets only the system domain.
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

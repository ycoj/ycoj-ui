import { clientRequest } from '@/api/client';

export type ProblemAutoCompleteItem = {
  docId: number;
  pid?: string;
  title: string;
};

export type ProblemAutoCompleteResponse = {
  pdocs: ProblemAutoCompleteItem[];
};

export const searchProblems = (domainId: string, query: string) =>
  clientRequest.Get<ProblemAutoCompleteResponse>(
    `/d/${encodeURIComponent(domainId)}/p`,
    {
      params: {
        q: query,
        quick: true,
        sort: query ? 'default' : 'recent',
      },
    }
  );

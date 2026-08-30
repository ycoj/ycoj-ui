import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import { alova } from '@/api/server';

const projection = ['docId', 'pid', 'title'] as const;

export const getProblemsByIds = (domainId: string, ids: number[]) =>
  alova.Post<ProblemAutoCompleteItem[]>(
    `/d/${encodeURIComponent(domainId)}/api/problems`,
    {
      args: { ids },
      projection,
    }
  );

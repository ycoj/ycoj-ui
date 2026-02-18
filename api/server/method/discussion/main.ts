import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type {
  Discussion as DiscussionDoc,
  Node,
} from '@/shared/types/discussion';
import type { Homework } from '@/shared/types/homework';
import type { ProblemDoc } from '@/shared/types/problem';
import type { TrainingDoc } from '@/shared/types/training';
import type { BaseUserDict } from '@/shared/types/user';

export type DiscussionMainVnode =
  | ProblemDoc
  | Contest
  | Homework
  | TrainingDoc
  | Node
  | Record<string, unknown>;

export type DiscussionMainResponse = {
  ddocs: DiscussionDoc[];
  dpcount: number;
  udict: BaseUserDict;
  page: number;
  page_name: 'discussion_main';
  vndict: Record<number, Record<string | number, DiscussionMainVnode>>;
  vnode: Record<string, unknown>;
  vnodes: Node[];
};

export const getDiscussionMain = (page?: number, all?: boolean) =>
  alova.Get<DiscussionMainResponse>('/discuss', {
    params: {
      ...(page !== undefined && { page }),
      ...(all !== undefined && { all }),
    },
  });

export const getDiscussionInNode = (
  type: string,
  name: string,
  page?: number
) => {
  return alova.Get<DiscussionMainResponse>(`/discuss/${type}/${name}`, {
    params: { page },
  });
};

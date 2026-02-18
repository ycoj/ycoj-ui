import { alova } from '@/api/server';
import type {
  DiscussionDetailVnode,
  DiscussionDoc,
  DiscussionReplyDoc,
  DiscussionStatus,
} from '@/shared/types/discussion';
import type { BaseUserDict } from '@/shared/types/user';

export type Breadcrumb = [
  title: string,
  routeName: string | null,
  routeParams?: Record<string, unknown> | null,
  exact?: boolean,
];

export type DiscussionDetailResponse = {
  path: Breadcrumb[];
  ddoc: DiscussionDoc;
  dsdoc: DiscussionStatus | null;
  drdocs: DiscussionReplyDoc[];
  page: number;
  pcount: number;
  drcount: number;
  udict: BaseUserDict;
  vnode: DiscussionDetailVnode;
  reactions: Record<string, Record<string, number>>;
};

export const getDiscussionDetail = (did: string, page?: number) =>
  alova.Get<DiscussionDetailResponse>(`/discuss/${did}`, {
    params: {
      ...(page !== undefined && { page }),
    },
  });

export {};

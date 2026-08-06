import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { ObjectId } from '@/shared/types/shared';
import type { User } from '@/shared/types/user';

export type RecordDetailResponse = {
  udoc: User;
  pdoc: ProblemDoc;
  rdoc: RecordDoc;
  tdoc: Contest | Homework;
  rev?: ObjectId;
  // JSON 序列化后 judgeAt 为 ISO 字符串
  allRevs: Record<ObjectId, string>;
};

export const getRecordDetail = (rid: string, rev?: string) =>
  alova.Get<RecordDetailResponse>(`/record/${rid}`, {
    params: rev ? { rev } : undefined,
  });

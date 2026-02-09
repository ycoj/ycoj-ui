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
  rev: ObjectId;
  allRevs: Record<ObjectId, Date>;
};

export const getRecordDetail = (rid: string) =>
  alova.Get<RecordDetailResponse>(`/record/${rid}`);

import { clientRequest } from '@/api/client';
import type { RecordListResponse } from '@/api/server/method/record/list';
import type { Errorable } from '@/shared/types/error';
import type { RecordDoc } from '@/shared/types/record';

export type FullRecordListResponse = Errorable<
  Omit<RecordListResponse, 'rdocs'> & { rdocs: RecordDoc[] }
>;

export type FullRecordListParams = {
  pid: number;
  tid?: string;
};

export const getFullRecordList = ({ pid, tid }: FullRecordListParams) =>
  clientRequest.Get<FullRecordListResponse>('/record', {
    params: {
      fullStatus: true,
      pid,
      ...(tid ? { tid } : {}),
    },
  });

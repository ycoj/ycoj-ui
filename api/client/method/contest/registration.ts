import { clientRequest } from '@/api/client';

export type ContestAttendRequest = {
  operation: 'attend' | 'subscribe';
  code?: string;
  subscribe?: boolean;
};

export type ContestAttendResponse = Record<string, never>;

export const attendContest = (tid: string, payload: ContestAttendRequest) =>
  clientRequest.Post<ContestAttendResponse>(`/contest/${tid}`, payload);

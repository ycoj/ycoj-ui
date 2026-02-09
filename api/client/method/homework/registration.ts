import { clientRequest } from '@/api/client';

export type HomeworkAttendRequest = {
  operation: 'attend';
};

export type HomeworkAttendResponse = Record<string, never>;

export const attendHomework = (tid: string, payload: HomeworkAttendRequest) =>
  clientRequest.Post<HomeworkAttendResponse>(`/homework/${tid}`, payload);

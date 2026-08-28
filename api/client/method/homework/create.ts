import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type CreateHomeworkRequest = {
  operation: 'update';
  beginAtDate: string;
  beginAtTime: string;
  penaltySinceDate: string;
  penaltySinceTime: string;
  extensionDays: number;
  penaltyRules: string;
  title: string;
  content: string;
  pids: string;
  rated: boolean;
  maintainer?: number[];
  assign?: string[];
  langs?: string[];
};

export type CreateHomeworkResponse = {
  tid: ObjectId;
};

export const createHomework = (payload: CreateHomeworkRequest) =>
  clientRequest.Post<CreateHomeworkResponse>('/homework/create', payload);

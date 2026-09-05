import { clientRequest } from '@/api/client';

export type DeletePreliminaryResponse = {
  url: string;
};

export const deletePreliminary = (paperId: string) =>
  clientRequest.Post<DeletePreliminaryResponse>(`/preliminary/${paperId}`, {
    operation: 'delete',
  });

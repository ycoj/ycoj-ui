import { clientRequest } from '@/api/client';

export type UserAutoCompleteItem = {
  _id: number;
  uname: string;
  displayName?: string;
  avatarUrl?: string;
};

const projection = ['_id', 'uname', 'displayName', 'avatarUrl'] as const;

export const searchUsers = (domainId: string, query: string) =>
  clientRequest.Post<UserAutoCompleteItem[]>(
    `/d/${encodeURIComponent(domainId)}/api/users`,
    {
      args: { search: query },
      projection,
    }
  );

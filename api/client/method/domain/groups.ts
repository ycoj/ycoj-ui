import { clientRequest } from '@/api/client';

export type UserGroupAutoCompleteItem = {
  name: string;
  uids?: number[];
};

const projection = ['name', 'uids'] as const;

const groupsEndpoint = (domainId: string) =>
  `/d/${encodeURIComponent(domainId)}/api/groups`;

export const searchGroups = (domainId: string, query: string) =>
  clientRequest.Post<UserGroupAutoCompleteItem[]>(groupsEndpoint(domainId), {
    args: { search: query },
    projection,
  });

export const getGroupsByNames = (domainId: string, names: string[]) =>
  clientRequest.Post<UserGroupAutoCompleteItem[]>(groupsEndpoint(domainId), {
    args: { names },
    projection,
  });

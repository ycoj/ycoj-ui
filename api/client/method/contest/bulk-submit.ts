import { uploadClientRequest } from '@/api/client';

export type ContestBulkSubmitOptions = {
  mapping: Record<number, string>;
  lang?: string;
  dryrun?: boolean;
  existingUser?: 'vuser' | 'existing';
  zipMode?: 'auto' | 'nested' | 'flat';
};

export type ContestBulkSubmitResult = {
  dryrun?: boolean;
  users?: Array<{
    uname: string;
    uid: number;
    created?: boolean;
    kind?: string;
    realUid?: number;
  }>;
  submitted?: Array<{
    uname: string;
    uid: number;
    pid: number;
    rid?: string;
  }>;
  skipped?: Array<{ uname: string; problem: string; reason: string }>;
};

export const submitContestBulk = (
  tid: string,
  file: File,
  options: ContestBulkSubmitOptions
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('filename', file.name);
  form.append('mapping', JSON.stringify(options.mapping));
  if (options.lang) form.append('lang', options.lang);
  if (options.dryrun !== undefined)
    form.append('dryrun', String(options.dryrun));
  if (options.existingUser) form.append('existingUser', options.existingUser);
  if (options.zipMode) form.append('zipMode', options.zipMode);
  return uploadClientRequest.Post<ContestBulkSubmitResult>(
    `/contest/${tid}/bulk-submit`,
    form
  );
};

import { clientRequest, uploadClientRequest } from '@/api/client';
import type { FileInfo } from '@/shared/types/file';

export type ContestManagementMutationResponse =
  { tid?: string; sid?: string } | Record<string, unknown>;

export const uploadContestFile = (
  tid: string,
  file: File,
  type: 'public' | 'private' = 'private',
  filename?: string
) => {
  const form = new FormData();
  form.append('operation', 'upload_file');
  form.append('file', file);
  form.append('type', type);
  form.append('filename', filename || file.name);
  return uploadClientRequest.Post<ContestManagementMutationResponse>(
    `/contest/${tid}/management`,
    form
  );
};

export const deleteContestFiles = (
  tid: string,
  files: string[],
  type: 'public' | 'private' = 'private'
) =>
  clientRequest.Post<ContestManagementMutationResponse>(
    `/contest/${tid}/management`,
    { operation: 'delete_files', files, type }
  );

export const setContestProblemScore = (
  tid: string,
  pid: number,
  score: number
) =>
  clientRequest.Post<ContestManagementMutationResponse>(
    `/contest/${tid}/management`,
    { operation: 'set_score', pid, score }
  );

export type ContestFileList = { files: FileInfo[]; privateFiles: FileInfo[] };

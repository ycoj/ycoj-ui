import { clientRequest } from '@/api/client';
import type {
  ProblemFileLinksData,
  ProblemFilesHandlerData,
  ProblemFileType,
} from '@/shared/types/problem-file';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemFileLinksResponse = ProblemFileLinksData;
export type ProblemFilesMutationResponse = ProblemFilesHandlerData;

const problemFilesConfig = (tid?: ObjectId) => ({
  params: tid ? { tid } : {},
});

export const getProblemFileLinks = (
  pid: string | number,
  files: string[],
  type: ProblemFileType = 'testdata',
  tid?: ObjectId
) =>
  clientRequest.Post<ProblemFileLinksResponse>(
    `/p/${pid}/files`,
    {
      operation: 'get_links',
      files,
      type,
    },
    problemFilesConfig(tid)
  );

export const uploadProblemFile = (
  pid: string | number,
  file: File,
  type: ProblemFileType = 'testdata',
  filename?: string,
  tid?: ObjectId
) => {
  const formData = new FormData();
  formData.append('operation', 'upload_file');
  formData.append('file', file);
  formData.append('type', type);
  if (filename) formData.append('filename', filename);

  return clientRequest.Post<ProblemFilesMutationResponse>(
    `/p/${pid}/files`,
    formData,
    problemFilesConfig(tid)
  );
};

export const renameProblemFiles = (
  pid: string | number,
  files: string[],
  newNames: string[],
  type: ProblemFileType = 'testdata',
  tid?: ObjectId
) =>
  clientRequest.Post<ProblemFilesMutationResponse>(
    `/p/${pid}/files`,
    {
      operation: 'rename_files',
      files,
      newNames,
      type,
    },
    problemFilesConfig(tid)
  );

export const deleteProblemFiles = (
  pid: string | number,
  files: string[],
  type: ProblemFileType = 'testdata',
  tid?: ObjectId
) =>
  clientRequest.Post<ProblemFilesMutationResponse>(
    `/p/${pid}/files`,
    {
      operation: 'delete_files',
      files,
      type,
    },
    problemFilesConfig(tid)
  );

export const generateProblemTestdata = (
  pid: string | number,
  std: string,
  gen: string,
  tid?: ObjectId
) =>
  clientRequest.Post<ProblemFilesMutationResponse>(
    `/p/${pid}/files`,
    {
      operation: 'generate_testdata',
      std,
      gen,
    },
    problemFilesConfig(tid)
  );

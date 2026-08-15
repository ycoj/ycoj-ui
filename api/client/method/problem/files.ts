import { clientRequest, uploadClientRequest } from '@/api/client';
import type { FileInfo } from '@/shared/types/file';
import type {
  ProblemFileLinksData,
  ProblemFilesHandlerData,
  ProblemFileType,
} from '@/shared/types/problem-file';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemFileLinksResponse = ProblemFileLinksData;
/** The base problem context returned after upload, rename, or deletion. */
export type ProblemFilesMutationResponse = ProblemFilesHandlerData;
export type GenerateProblemTestdataResponse = ProblemFilesMutationResponse & {
  /** URL of the record page that tracks the asynchronous testdata-generation job. */
  url: string;
};

const isValidRenameTarget = (name: string) =>
  name !== '.' && name !== '..' && !/[\\/]/.test(name);

const problemFilesConfig = (tid?: ObjectId) => ({
  params: tid ? { tid } : {},
});

const getUploadBaseUrl = () =>
  process.env.NEXT_PUBLIC_UPLOAD_BASEURL?.replace(/\/+$/, '') ?? '';

const problemFileUploadConfig = (url: string, tid?: ObjectId) => {
  const config = problemFilesConfig(tid);
  if (
    typeof window === 'undefined' ||
    new URL(url, window.location.origin).host === window.location.host
  )
    return config;

  // Login is proxied through Next.js, so its host-scoped session cookie is not
  // available to a different upload host. Hydro also accepts sid as a query.
  const sid = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('sid='))
    ?.slice('sid='.length);

  return sid ? { params: { ...config.params, sid } } : config;
};

/**
 * Creates temporary download URLs for problem files.
 *
 * @param files Stored file names to authorize for download.
 * @param type File collection containing the requested names.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
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

/** Refreshes the current testdata list without navigating away from an editor. */
export const refreshProblemTestdata = async (
  pid: string | number,
  tid?: ObjectId
) => {
  const response = await clientRequest
    .Get<{ testdata: FileInfo[] }>(`/p/${pid}/files`, problemFilesConfig(tid))
    .send();
  return response.testdata;
};

/** Resolves one short-lived direct download URL. */
export const getProblemFileDownloadUrl = async (
  pid: string | number,
  filename: string,
  type: ProblemFileType = 'testdata',
  tid?: ObjectId
) => {
  const response = await getProblemFileLinks(pid, [filename], type, tid).send();
  return response.links[filename] ?? '';
};

/** Uploads config.yaml using the same file endpoint as other testdata. */
export const uploadProblemConfig = (
  pid: string | number,
  yaml: string,
  tid?: ObjectId
) =>
  uploadProblemFile(
    pid,
    new File([yaml], 'config.yaml', { type: 'text/yaml' }),
    'testdata',
    'config.yaml',
    tid
  );

/**
 * Uploads a problem file.
 *
 * @param type Destination file collection.
 * @param filename Stored name for a single uploaded file. A testdata ZIP is
 * unpacked and uses the archive entry names instead.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
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

  const url = `${getUploadBaseUrl()}/p/${pid}/files`;
  return uploadClientRequest.Post<ProblemFilesMutationResponse>(
    url,
    formData,
    problemFileUploadConfig(url, tid)
  );
};

/**
 * Renames files in a problem file collection.
 *
 * @param files Existing file names.
 * @param newNames Replacement names paired with `files` by index.
 * @param type File collection containing the files.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
export const renameProblemFiles = (
  pid: string | number,
  files: string[],
  newNames: string[],
  type: ProblemFileType = 'testdata',
  tid?: ObjectId
) => {
  if (newNames.some((name) => !isValidRenameTarget(name)))
    throw new Error('Invalid filename');

  return clientRequest.Post<ProblemFilesMutationResponse>(
    `/p/${pid}/files`,
    {
      operation: 'rename_files',
      files,
      newNames,
      type,
    },
    problemFilesConfig(tid)
  );
};

/**
 * Deletes files from a problem file collection.
 *
 * @param files Stored file names to delete.
 * @param type File collection containing the files.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
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

/**
 * Starts an asynchronous testdata-generation record.
 *
 * @param std Name of a testdata file containing the standard solution program.
 * @param gen Name of a testdata file containing the generator program.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
export const generateProblemTestdata = (
  pid: string | number,
  std: string,
  gen: string,
  tid?: ObjectId
) =>
  clientRequest.Post<GenerateProblemTestdataResponse>(
    `/p/${pid}/files`,
    {
      operation: 'generate_testdata',
      std,
      gen,
    },
    problemFilesConfig(tid)
  );

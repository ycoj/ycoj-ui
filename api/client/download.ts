import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

const DOWNLOAD_MEDIA_TYPES = ['image/png', 'application/zip'];

export class DownloadResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadResponseError';
  }
}

async function readErrorMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error
    )
      return body.error;
  } catch {
    // The server did not return a JSON error body.
  }
  return null;
}

export async function toDownloadBlob(response: Response) {
  if (!response.ok) {
    const message = await readErrorMessage(response);
    if (message) throw new DownloadResponseError(message);
    throw new Error('Download failed');
  }
  const mediaType = response.headers.get('content-type')?.split(';')[0].trim();
  if (!mediaType || !DOWNLOAD_MEDIA_TYPES.includes(mediaType))
    throw new Error('Download failed');
  return response.blob();
}

export const downloadRequest = createAlova({
  baseURL: '',
  requestAdapter: adapterFetch(),
  statesHook: ReactHook,
  beforeRequest(method) {
    method.config.credentials = 'include';
  },
  responded: toDownloadBlob,
  cacheFor: { GET: 0 },
  cacheLogger: false,
});

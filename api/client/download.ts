import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

export const downloadRequest = createAlova({
  baseURL: '/api',
  requestAdapter: adapterFetch(),
  statesHook: ReactHook,
  beforeRequest(method) {
    method.config.credentials = 'include';
  },
  async responded(response) {
    if (
      !response.ok ||
      !['image/png', 'application/zip'].includes(
        response.headers.get('content-type') || ''
      )
    ) {
      throw new Error('Download failed');
    }
    return response.blob();
  },
  cacheFor: { GET: 0 },
  cacheLogger: false,
});

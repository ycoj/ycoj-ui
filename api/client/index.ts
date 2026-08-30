import { isSudoRequired } from '@/shared/lib/backend-response';
import { navigateToSudo } from '@/shared/lib/sudo-navigation';
import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

export function handleClientSudoResponse<T>(data: T): T {
  if (isSudoRequired(data) && window.location.pathname !== '/user/sudo')
    navigateToSudo();
  return data;
}

export const clientRequest = createAlova({
  baseURL: '/api',
  requestAdapter: adapterFetch(),
  statesHook: ReactHook,
  async beforeRequest(method) {
    method.config.credentials = 'include';
    method.config.headers['Accept'] = 'application/json';
  },
  async responded(response) {
    return handleClientSudoResponse(await response.json());
  },
  cacheLogger: false,
});

export const uploadClientRequest = createAlova({
  id: 'upload',
  baseURL: '/api',
  requestAdapter: xhrRequestAdapter(),
  statesHook: ReactHook,
  async beforeRequest(method) {
    method.config.withCredentials = true;
    method.config.headers['Accept'] = 'application/json';
  },
  responded(response) {
    return handleClientSudoResponse(response.data);
  },
  cacheLogger: false,
});

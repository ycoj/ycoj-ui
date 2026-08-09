import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

export const clientRequest = createAlova({
  baseURL: '/api',
  requestAdapter: adapterFetch(),
  statesHook: ReactHook,
  async beforeRequest(method) {
    method.config.credentials = 'include';
    method.config.headers['Accept'] = 'application/json';
  },
  responded(response) {
    return response.json();
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
    return response.data;
  },
  cacheLogger: false,
});

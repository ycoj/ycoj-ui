'server-only';

import { isSudoRequired } from '@/shared/lib/backend-response';
import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const alova = createAlova({
  baseURL: process.env.BACKEND_BASEURL,
  requestAdapter: adapterFetch(),
  statesHook: ReactHook,
  async beforeRequest(method) {
    const h = await headers();
    method.config.headers['Cookie'] = h.get('Cookie') || '';
    method.config.headers['Accept'] = 'application/json';
  },
  async responded(response) {
    const data = await response.json();
    if (isSudoRequired(data)) redirect('/user/sudo');
    return data;
  },
  cacheLogger: false,
  cacheFor: {
    GET: 0,
  },
});

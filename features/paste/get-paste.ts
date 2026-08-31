import ServerApis from '@/api/server/method';
import { cache } from 'react';
import 'server-only';

export const getPasteDetail = cache(async (id: string) =>
  ServerApis.Paste.getPasteDetail(id).send()
);

export const getPasteEdit = cache(async (id: string) =>
  ServerApis.Paste.getPasteEdit(id).send()
);

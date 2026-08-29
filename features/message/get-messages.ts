import ServerApis from '@/api/server/method';
import { cache } from 'react';

export const getMessages = cache(async () => {
  return await ServerApis.Messages.getMessages();
});

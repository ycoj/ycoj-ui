'server-only';

import ServerApis from '@/api/server/method';
import { getUser } from '@/features/user/lib/get-user';
import { hasPriv, PRIV } from '@/features/user/lib/priv';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getAccountSettings = cache(async () => {
  const user = await getUser();
  if (!user?._id || !hasPriv(user, PRIV.PRIV_USER_PROFILE)) redirect('/login');
  const data = await ServerApis.Account.getAccountSettings();
  if (
    'url' in data ||
    ('error' in data &&
      ['PermissionError', 'PrivilegeError'].includes(data.error.name))
  )
    redirect('/login');
  return data;
});

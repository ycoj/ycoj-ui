import { getUser } from '@/features/user/lib/get-user';
import { PRIV } from '@/features/user/lib/priv';
import { redirect } from 'next/navigation';

export default async function ManagePage() {
  const user = await getUser();
  if (user.priv !== PRIV.PRIV_ALL) redirect('/home');
  redirect('/manage/realname');
}

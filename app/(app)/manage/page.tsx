import { manageLanding } from '@/features/manage/manage-access';
import { getUser } from '@/features/user/lib/get-user';
import { redirect } from 'next/navigation';

export default async function ManagePage() {
  const user = await getUser();
  redirect(manageLanding(user));
}

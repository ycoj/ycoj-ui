import { canImportUsers } from '@/features/manage/manage-access';
import UserImportForm from '@/features/manage/user-import/user-import-form';
import { getUser } from '@/features/user/lib/get-user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('userImport');
  return { title: t('title') };
}

export default async function UserImportPage() {
  const user = await getUser();
  if (!canImportUsers(user)) redirect('/home');
  return <UserImportForm />;
}

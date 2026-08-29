import ServerApis from '@/api/server/method';
import HomeworkCreateForm from '@/features/homework/create/homework-create-form';
import { getHomeworkCreateDefaults } from '@/features/homework/form/homework-form-utils';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('createHomework') };
}

export default async function HomeworkCreatePage() {
  const [user, homepage] = await Promise.all([
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  if (!hasPerm(user, PERM.PERM_CREATE_HOMEWORK)) redirect('/homework');

  return (
    <HomeworkCreateForm
      domainId={homepage.domain._id}
      defaultValues={getHomeworkCreateDefaults(user.timeZone)}
    />
  );
}

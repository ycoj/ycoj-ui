import ServerApis from '@/api/server/method';
import ContestCreateForm from '@/features/contest/create/contest-create-form';
import { getContestCreateDefaults } from '@/features/contest/form/contest-form-utils';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('createContest') };
}

export default async function ContestCreatePage() {
  const [user, homepage] = await Promise.all([
    getUser(),
    ServerApis.UI.getHomepage(),
  ]);
  if (!hasPerm(user, PERM.PERM_CREATE_CONTEST)) redirect('/contest');

  const canAutoHide = hasPerm(user, PERM.PERM_EDIT_PROBLEM);
  const defaultValues = {
    ...getContestCreateDefaults(user.timeZone),
    autoHide: canAutoHide,
  };

  return (
    <ContestCreateForm
      defaultValues={defaultValues}
      canAutoHide={canAutoHide}
      domainId={homepage.domain._id}
    />
  );
}

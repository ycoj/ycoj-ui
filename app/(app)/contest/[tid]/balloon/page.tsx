import { canEditContest } from '@/features/contest/lib/can-edit-contest';
import ContestManagementPage from '@/features/contest/management/contest-management-page';
import { getContestBalloons } from '@/features/contest/management/get-contest-management';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = { tid: string };
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('contestBalloons') };
}
export default async function Page({ params }: { params: Promise<Params> }) {
  const { tid } = await params;
  const [data, user] = await Promise.all([getContestBalloons(tid), getUser()]);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={String(data.error)} />;
  if (!canEditContest(user, data.tdoc))
    return <Errored title={t('unavailable')} error={t('unavailable')} />;
  return (
    <ContestManagementPage
      mode="balloon"
      tid={tid}
      data={data}
      owner={data.owner_udoc}
    />
  );
}

import ContestSolutionForm from '@/features/contest/solution/contest-solution-form';
import { getContestSolutionEdit } from '@/features/contest/solution/get-contest-solution';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ tid: string; sid: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contestSolution');
  return { title: t('edit') };
}

export default async function ContestSolutionEditPage({ params }: Props) {
  const { tid, sid } = await params;
  const data = await getContestSolutionEdit(tid, sid);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;
  if (!data.canManage)
    return <Errored title={t('unavailable')} error={t('unavailable')} />;
  return (
    <ContestSolutionForm
      tid={tid}
      sid={sid}
      initialValues={{
        title: data.csdoc.title ?? '',
        content: data.csdoc.content ?? '',
      }}
    />
  );
}

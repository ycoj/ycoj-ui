import ContestSolutionEditForm from '@/features/contest/solution/contest-solution-edit-form';
import {
  getContestSolutionEdit,
  requireContestSolutionManage,
} from '@/features/contest/solution/get-contest-solution';
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
  const result = requireContestSolutionManage(data, t('unavailable'));
  if ('error' in result)
    return <Errored title={t('unavailable')} error={result.error} />;
  return (
    <ContestSolutionEditForm
      tid={tid}
      sid={sid}
      defaultValues={{
        title: result.data.csdoc.title,
        content: result.data.csdoc.content,
      }}
    />
  );
}

import ContestSolutionDetail from '@/features/contest/solution/contest-solution-detail';
import { getContestSolution } from '@/features/contest/solution/get-contest-solution';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ tid: string; sid: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tid, sid } = await params;
  const data = await getContestSolution(tid, sid);
  const t = await getTranslations('contestSolution');
  return { title: 'error' in data ? t('heading') : data.csdoc.title };
}

export default async function ContestSolutionPage({ params }: Props) {
  const { tid, sid } = await params;
  const data = await getContestSolution(tid, sid);
  const t = await getTranslations('error');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;
  return <ContestSolutionDetail tid={tid} data={data} />;
}

import ContestSolutionCreateForm from '@/features/contest/solution/contest-solution-create-form';
import {
  getContestSolutionCreate,
  requireContestSolutionManage,
} from '@/features/contest/solution/get-contest-solution';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ tid: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('contestSolution');
  return { title: t('create') };
}

export default async function ContestSolutionCreatePage({ params }: Props) {
  const { tid } = await params;
  const data = await getContestSolutionCreate(tid);
  const t = await getTranslations('error');
  const result = requireContestSolutionManage(data, t('unavailable'));
  if ('error' in result)
    return <Errored title={t('unavailable')} error={result.error} />;
  return <ContestSolutionCreateForm tid={tid} />;
}

import ServerApis from '@/api/server/method';
import SolutionReviewWorkspace from '@/features/problem/solution/review/solution-review-workspace';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('solution.review');
  return { title: t('title') };
}

export default async function SolutionReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getUser();
  if (!hasPerm(user, PERM.PERM_DELETE_PROBLEM_SOLUTION)) redirect('/problem');

  const status =
    (await searchParams).status === 'authors' ? 'authors' : 'pending';
  const data = await ServerApis.Problems.getSolutionReview(status);
  if ('error' in data) {
    const t = await getTranslations('solution.review');
    return <Errored title={t('title')} error={data.error} />;
  }
  return <SolutionReviewWorkspace data={data} />;
}

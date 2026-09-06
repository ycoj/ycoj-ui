import ProblemTitle from '@/features/problem/detail/problem-title';
import { getProblemSolution } from '@/features/problem/solution/get-problem-solution';
import SolutionContent from '@/features/problem/solution/solution-content';
import SolutionRight from '@/features/problem/solution/solution-right';
import { Errored } from '@/shared/components/errored';
import Pagination from '@/shared/components/pagination';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  pid: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await getProblemSolution(pid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('solutions') };
  return {
    title: `${data.pdoc.title} - ${t('solutions')}`,
  };
}

export default async function ProblemSolutionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ sid?: string; page?: string }>;
}) {
  const { pid } = await params;
  const { sid, page } = await searchParams;
  const pageNumber = Number(page ?? 1);
  const data = await getProblemSolution(
    pid,
    sid,
    Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1
  );
  if ('error' in data) {
    const t = await getTranslations('metadata');
    return <Errored title={t('solutions')} error={data.error} />;
  }

  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={<SolutionContent data={data} />}
        right={
          <SolutionRight problem={data.pdoc} solutionCount={data.pscount} />
        }
      />
      {!sid && <Pagination page={data.page} totalPages={data.pcount} />}
    </div>
  );
}

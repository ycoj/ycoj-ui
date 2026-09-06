import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { getProblemSolution } from '@/features/problem/solution/get-problem-solution';
import SolutionCreateForm from '@/features/problem/solution/solution-create-form';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type Params = {
  pid: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await getProblemDetail(pid);
  const t = await getTranslations('metadata');

  if ('error' in data) {
    return {
      title: t('createSolution'),
    };
  }

  return {
    title: `${data.pdoc.title} - ${t('createSolution')}`,
  };
}

export default async function ProblemSolutionCreatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pid } = await params;
  const user = await getUser();
  if (!hasPerm(user, PERM.PERM_CREATE_PROBLEM_SOLUTION))
    redirect(`/problem/${pid}/solution`);
  const data = await getProblemSolution(pid);
  const t = await getTranslations('problem');

  if ('error' in data) {
    return <Errored title={t('unavailable')} error={data.error} />;
  }

  if (data.solutionBlocked) {
    const solutionT = await getTranslations('solution');
    return (
      <div className="space-y-6" data-llm-visible="true">
        <ProblemTitle problem={data.pdoc} />
        <p role="status">{solutionT('errors.blocked')}</p>
        <Link className="text-sm underline" href={`/problem/${pid}/solution`}>
          {solutionT('back')}
        </Link>
      </div>
    );
  }
  return <SolutionCreateContent data={data} pid={pid} />;
}

function SolutionCreateContent({
  data,
  pid,
}: {
  data: Pick<ProblemDetailData, 'pdoc'>;
  pid: string;
}) {
  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} />
      <div className="space-y-6">
        <SolutionCreateForm problemId={data.pdoc.docId} routePid={pid} />
      </div>
    </div>
  );
}

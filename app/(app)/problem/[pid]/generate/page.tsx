import ServerApis from '@/api/server/method';
import ProblemTitle from '@/features/problem/detail/problem-title';
import AiGenerationForm from '@/features/problem/generate/ai-generation-form';
import { canEditProblem } from '@/features/problem/lib/can-edit-problem';
import ProblemSidebar from '@/features/problem/sidebar';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';

const loadProblemConfig = cache((pid: string) =>
  ServerApis.Problems.getProblemConfig(pid)
);

type Params = { pid: string };
type SearchParams = { tid?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await loadProblemConfig(pid);
  const t = await getTranslations('metadata');
  if ('error' in data) return { title: t('aiGeneration') };
  return { title: `${data.pdoc.title} - ${t('aiGeneration')}` };
}

export default async function ProblemGeneratePage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const [data, user] = await Promise.all([loadProblemConfig(pid), getUser()]);
  const t = await getTranslations('problem');
  if ('error' in data)
    return <Errored title={t('unavailable')} error={data.error} />;

  const canGenerate =
    !searchParams.tid &&
    canEditProblem(user, {
      owner: data.pdoc.owner,
      reference: data.pdoc.reference,
    });
  if (!canGenerate)
    return <Errored title={t('unavailable')} error={t('unavailable')} />;

  const options = await ServerApis.Problems.getAiGenerationOptions(pid);
  if ('error' in options)
    return <Errored title={t('unavailable')} error={options.error} />;

  return (
    <div className="space-y-6 [&_[data-slot=button]:not(:disabled)]:cursor-pointer">
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={<AiGenerationForm pid={pid} options={options} />}
        right={
          <ProblemSidebar
            allowSubmit={false}
            showBackToProblem={true}
            discussionCount={data.discussionCount}
            solutionCount={data.solutionCount}
            problem={data.pdoc}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            allowConfigure={true}
          />
        }
      />
    </div>
  );
}

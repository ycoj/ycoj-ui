import { getProblemFiles } from '@/api/server/method/problems/files';
import ProblemTitle from '@/features/problem/detail/problem-title';
import ProblemFilesManager from '@/features/problem/files/problem-files-manager';
import ProblemSidebar from '@/features/problem/sidebar';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { ProblemFilesData } from '@/shared/types/problem-file';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = { pid: string };
type SearchParams = { tid?: string };

export async function generateMetadata({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const data = await getProblemFiles(pid, undefined, false, searchParams.tid);
  const t = await getTranslations('metadata');

  if ('error' in data) return { title: t('files') };
  return { title: `${data.pdoc.title} - ${t('files')}` };
}

export default async function ProblemFilesPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const data = await getProblemFiles(pid, undefined, false, searchParams.tid);
  const t = await getTranslations('problem');

  if ('error' in data) {
    return <Errored title={t('unavailable')} error={data.error} />;
  }

  return <ProblemFilesContent data={data} pid={pid} tid={searchParams.tid} />;
}

function ProblemFilesContent({
  data,
  pid,
  tid,
}: {
  data: ProblemFilesData;
  pid: string;
  tid?: string;
}) {
  return (
    <div className="space-y-6 [&_[data-slot=button]:not(:disabled)]:cursor-pointer">
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <ProblemFilesManager
            pid={pid}
            tid={tid}
            testdata={data.testdata}
            additionalFiles={data.additional_file}
            canManage={data.mode === 'normal'}
          />
        }
        right={
          <ProblemSidebar
            allowSubmit={false}
            showBackToProblem={true}
            discussionCount={data.discussionCount}
            solutionCount={data.solutionCount}
            problem={data.pdoc}
            tid={tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
          />
        }
      />
    </div>
  );
}

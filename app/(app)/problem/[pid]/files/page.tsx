import { getProblemFiles } from '@/api/server/method/problems/files';
import ProblemTitle from '@/features/problem/detail/problem-title';
import ProblemFilesManager from '@/features/problem/files/problem-files-manager';
import { canEditProblem } from '@/features/problem/lib/can-edit-problem';
import ProblemSidebar from '@/features/problem/sidebar';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, hasPriv, PERM, PRIV } from '@/features/user/lib/priv';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { ProblemFilesData } from '@/shared/types/problem-file';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';

const loadProblemFiles = cache((pid: string, tid?: string) =>
  getProblemFiles(pid, undefined, false, tid)
);

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
  const data = await loadProblemFiles(pid, searchParams.tid);
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
  const [data, user] = await Promise.all([
    loadProblemFiles(pid, searchParams.tid),
    getUser(),
  ]);
  const t = await getTranslations('problem');

  if ('error' in data) {
    return <Errored title={t('unavailable')} error={data.error} />;
  }

  const canManage = canEditProblem(
    user,
    {
      owner: data.pdoc.owner,
      reference: data.reference ?? data.pdoc.reference,
    },
    { tid: searchParams.tid }
  );
  const canDownloadTestdata =
    user._id === data.pdoc.owner ||
    hasPriv(user, PRIV.PRIV_READ_PROBLEM_DATA) ||
    hasPerm(user, PERM.PERM_READ_PROBLEM_DATA);

  return (
    <ProblemFilesContent
      data={data}
      pid={pid}
      domainId={data.pdoc.domainId}
      tid={searchParams.tid}
      canManage={canManage}
      canGenerate={canManage && !searchParams.tid}
      canDownloadTestdata={canDownloadTestdata}
    />
  );
}

function ProblemFilesContent({
  data,
  pid,
  domainId,
  tid,
  canManage,
  canGenerate,
  canDownloadTestdata,
}: {
  data: ProblemFilesData;
  pid: string;
  domainId: string;
  tid?: string;
  canManage: boolean;
  canGenerate: boolean;
  canDownloadTestdata: boolean;
}) {
  return (
    <div className="space-y-6 [&_[data-slot=button]:not(:disabled)]:cursor-pointer">
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <ProblemFilesManager
            pid={pid}
            domainId={domainId}
            tid={tid}
            testdata={data.testdata}
            additionalFiles={data.additional_file}
            canManage={canManage}
            canGenerate={canGenerate}
            canDownloadTestdata={canDownloadTestdata}
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
            allowConfigure={canManage}
          />
        }
      />
    </div>
  );
}

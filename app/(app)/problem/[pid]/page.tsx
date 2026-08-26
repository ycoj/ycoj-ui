import ContestTimer from '@/features/contest/contest-timer';
import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemContent from '@/features/problem/detail/problem-content';
import ProblemTitle from '@/features/problem/detail/problem-title';
import { isObjectiveProblem } from '@/features/problem/detail/problem-type';
import { canEditProblem } from '@/features/problem/lib/can-edit-problem';
import ObjectiveProblemPage from '@/features/problem/objective/objective-page';
import ProblemSidebar from '@/features/problem/sidebar';
import { getUser } from '@/features/user/lib/get-user';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { User } from '@/shared/types/user';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Params = {
  pid: string;
};

type SearchParams = {
  tid?: string;
};

export async function generateMetadata({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const data = await getProblemDetail(pid, searchParams.tid);
  const t = await getTranslations('metadata');

  if ('error' in data) {
    return {
      title: t('problemDetail'),
    };
  }

  return {
    title: data.pdoc.title || t('problemDetail'),
  };
}

export default async function ProblemDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { pid } = await params;
  const searchParams = await searchParamsPromise;
  const [data, user] = await Promise.all([
    getProblemDetail(pid, searchParams.tid),
    getUser(),
  ]);
  const t = await getTranslations('problem');

  if ('error' in data) {
    return <Errored title={t('unavailable')} error={data.error} />;
  }

  const canConfigure = canEditProblem(user, data.pdoc, {
    tid: searchParams.tid,
  });

  return (
    <ProblemDetailContent
      data={data}
      searchParams={searchParams}
      canConfigure={canConfigure}
      user={user}
    />
  );
}

function ProblemDetailContent({
  data,
  searchParams,
  canConfigure,
  user,
}: {
  data: ProblemDetailData;
  searchParams: SearchParams;
  canConfigure: boolean;
  user: User | null;
}) {
  if (isObjectiveProblem(data.pdoc)) {
    return (
      <ObjectiveProblemPage
        data={data}
        tid={searchParams.tid}
        canConfigure={canConfigure}
        user={user}
      />
    );
  }
  return (
    <div className="space-y-6">
      {data.tdoc && <ContestTimer contest={data.tdoc} status={data.tsdoc} />}
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={<ProblemContent problem={data.pdoc} tid={searchParams.tid} />}
        right={
          <ProblemSidebar
            allowSubmit={true}
            discussionCount={data.discussionCount}
            solutionCount={data.solutionCount}
            problem={data.pdoc}
            tid={searchParams.tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
            allowConfigure={canConfigure}
          />
        }
      />
    </div>
  );
}

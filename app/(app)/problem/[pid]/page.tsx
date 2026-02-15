import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemContent from '@/features/problem/detail/problem-content';
import ProblemTitle from '@/features/problem/detail/problem-title';
import ProblemSidebar from '@/features/problem/sidebar';
import { Errored } from '@/shared/components/errored';
import TwoColumnLayout from '@/shared/layout/two-column';
import { Metadata } from 'next';

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

  if ('error' in data) {
    return {
      title: '题目详情',
    };
  }

  return {
    title: data.pdoc.title || '题目详情',
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
  const data = await getProblemDetail(pid, searchParams.tid);

  if ('error' in data) {
    return <Errored title="题目暂不可用" error={data.error} />;
  }

  return <ProblemDetailContent data={data} searchParams={searchParams} />;
}

function ProblemDetailContent({
  data,
  searchParams,
}: {
  data: ProblemDetailData;
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} contest={data.tdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={<ProblemContent problem={data.pdoc} />}
        right={
          <ProblemSidebar
            allowSubmit={true}
            discussionCount={data.discussionCount}
            solutionCount={data.solutionCount}
            problem={data.pdoc}
            tid={searchParams.tid}
            contest={data.tdoc}
            contestStatus={data.tsdoc}
          />
        }
      />
    </div>
  );
}

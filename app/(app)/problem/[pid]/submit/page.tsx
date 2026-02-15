import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemTitle from '@/features/problem/detail/problem-title';
import ProblemSidebar from '@/features/problem/sidebar';
import ProblemSubmitForm from '@/features/problem/submit/problem-submit-form';
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
      title: '提交',
    };
  }

  return {
    title: `${data.pdoc.title} - 提交`,
  };
}

export default async function ProblemSubmitPage({
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

  return <ProblemSubmitContent data={data} searchParams={searchParams} />;
}

function ProblemSubmitContent({
  data,
  searchParams,
}: {
  data: ProblemDetailData;
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <div data-llm-visible="true">
            <ProblemSubmitForm
              problem={data.pdoc}
              tid={searchParams.tid}
              contest={data.tdoc}
            />
          </div>
        }
        right={
          <ProblemSidebar
            allowSubmit={false}
            showBackToProblem={true}
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

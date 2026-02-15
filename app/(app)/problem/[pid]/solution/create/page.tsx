import {
  getProblemDetail,
  type ProblemDetailData,
} from '@/features/problem/detail/get-problem-detail';
import ProblemTitle from '@/features/problem/detail/problem-title';
import SolutionCreateForm from '@/features/problem/solution/solution-create-form';
import { Errored } from '@/shared/components/errored';
import type { Metadata } from 'next';

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

  if ('error' in data) {
    return {
      title: '创建题解',
    };
  }

  return {
    title: `${data.pdoc.title} - 创建题解`,
  };
}

export default async function ProblemSolutionCreatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pid } = await params;
  const data = await getProblemDetail(pid);

  if ('error' in data) {
    return <Errored title="题目暂不可用" error={data.error} />;
  }

  return <SolutionCreateContent data={data} pid={pid} />;
}

function SolutionCreateContent({
  data,
  pid,
}: {
  data: ProblemDetailData;
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

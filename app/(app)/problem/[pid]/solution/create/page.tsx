import { getProblemDetail } from '@/features/problem/detail/get-problem-detail';
import ProblemTitle from '@/features/problem/detail/problem-title';
import SolutionCreateForm from '@/features/problem/solution/solution-create-form';
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

  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} />
      <div className="space-y-6">
        <SolutionCreateForm problemId={data.pdoc.docId} routePid={pid} />
      </div>
    </div>
  );
}

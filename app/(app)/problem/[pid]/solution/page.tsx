import ProblemTitle from '@/features/problem/detail/problem-title';
import { getProblemSolution } from '@/features/problem/solution/get-problem-solution';
import SolutionContent from '@/features/problem/solution/solution-content';
import SolutionRight from '@/features/problem/solution/solution-right';
import TwoColumnLayout from '@/shared/layout/two-column';
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
  const data = await getProblemSolution(pid);
  return {
    title: `${data.pdoc.title} - 题解`,
  };
}

export default async function ProblemSolutionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pid } = await params;
  const data = await getProblemSolution(pid);

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
    </div>
  );
}

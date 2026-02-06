import ProblemTitle from '@/features/problem/detail/problem-title';
import ProblemSidebar from '@/features/problem/sidebar';
import { getProblemSolution } from '@/features/problem/solution/get-problem-solution';
import SolutionList from '@/features/problem/solution/solution-list';
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
        left={<SolutionList data={data} />}
        right={
          <ProblemSidebar
            allowSubmit={false}
            showBackToProblem={true}
            solutionCount={data.pscount}
            problem={data.pdoc}
          />
        }
      />
    </div>
  );
}

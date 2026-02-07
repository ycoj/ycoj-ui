import ProblemTitle from '@/features/problem/detail/problem-title';
import { getProblemSolution } from '@/features/problem/solution/get-problem-solution';
import SolutionCreateForm from '@/features/problem/solution/solution-create-form';
import type { Metadata } from 'next';

type Params = {
  pid: string;
  psid: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { pid } = await params;
  const data = await getProblemSolution(pid);
  return {
    title: `${data.pdoc.title} - 编辑题解`,
  };
}

export default async function ProblemSolutionEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { pid, psid } = await params;
  const data = await getProblemSolution(pid, psid);
  const solution =
    data.psdocs.find((item) => item.docId === psid) ?? data.psdocs[0];

  if (!solution) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ProblemTitle problem={data.pdoc} />
      <div className="space-y-6">
        <SolutionCreateForm
          problemId={data.pdoc.docId}
          routePid={pid}
          mode="edit"
          psid={solution.docId}
          initialContent={solution.content}
        />
      </div>
    </div>
  );
}

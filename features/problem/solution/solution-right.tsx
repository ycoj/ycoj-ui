import ProblemSidebar from '@/features/problem/sidebar';
import type { ContestListProjectionProblem } from '@/shared/types/problem';

type Props = {
  problem: ContestListProjectionProblem;
  solutionCount?: number;
};

export default async function SolutionRight({ problem, solutionCount }: Props) {
  return (
    <ProblemSidebar
      allowSubmit={false}
      showBackToProblem={true}
      solutionCount={solutionCount}
      problem={problem}
    />
  );
}

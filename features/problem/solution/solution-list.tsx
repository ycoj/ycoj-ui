import SolutionItem from './solution-item';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { cn } from '@/shared/lib/utils';

type Props = {
  data: ProblemSolutionResponse;
};

export default function SolutionList({ data }: Props) {
  if (!data.psdocs.length) {
    return (
      <div className="text-muted-foreground text-sm" data-llm-visible="true">
        <span data-llm-text="暂无题解">暂无题解</span>
      </div>
    );
  }

  return (
    <div className="divide-y" data-llm-visible="true">
      {data.psdocs.map((solution, index) => (
        <div key={solution.docId} className={cn(index === 0 && 'pt-0')}>
          <SolutionItem
            solution={solution}
            udict={data.udict}
            pssdict={data.pssdict}
            pid={data.pdoc.pid ?? data.pdoc.docId}
          />
        </div>
      ))}
    </div>
  );
}

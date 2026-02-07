import SolutionItem from './solution-item';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { Separator } from '@/shared/components/ui/separator';
import { Fragment } from 'react';

type Props = {
  data: ProblemSolutionResponse;
  viewerId?: number;
  allowEditAny: boolean;
  allowEditSelf: boolean;
  allowDeleteAny: boolean;
  allowDeleteSelf: boolean;
};

export default function SolutionList({
  data,
  viewerId,
  allowEditAny,
  allowEditSelf,
  allowDeleteAny,
  allowDeleteSelf,
}: Props) {
  if (!data.psdocs.length) {
    return (
      <div className="text-muted-foreground text-sm" data-llm-visible="true">
        <span data-llm-text="暂无题解">暂无题解</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-llm-visible="true">
      {data.psdocs.map((solution, index) => (
        <Fragment key={solution.docId}>
          <SolutionItem
            solution={solution}
            udict={data.udict}
            pssdict={data.pssdict}
            pid={data.pdoc.pid ?? data.pdoc.docId}
            viewerId={viewerId}
            allowEditAny={allowEditAny}
            allowEditSelf={allowEditSelf}
            allowDeleteAny={allowDeleteAny}
            allowDeleteSelf={allowDeleteSelf}
          />
          {index < data.psdocs.length - 1 && <Separator className="mt-6" />}
        </Fragment>
      ))}
    </div>
  );
}

import SolutionItem from './solution-item';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import { IdeaIcon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
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
  const pid = data.pdoc.pid ?? data.pdoc.docId;

  if (!data.psdocs.length) {
    return (
      <Empty data-llm-visible="true">
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={IdeaIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无题解">暂无题解</EmptyTitle>
          <EmptyDescription data-llm-text="成为第一个分享解法的人吧">
            目前还没有人分享题解，你可以成为第一个分享题解的人。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="secondary">
            <Link href={`/problem/${pid}/solution`}>
              <HugeiconsIcon
                icon={Refresh01Icon}
                strokeWidth={2}
                className="size-4"
                data-icon="inline-start"
              />
              <span data-llm-text="刷新">刷新</span>
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
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
            pid={pid}
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

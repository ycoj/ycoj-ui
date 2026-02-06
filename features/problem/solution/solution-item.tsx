import SolutionVote from './solution-vote';
import UserSpan from '@/features/user/user-span';
import Markdown from '@/shared/components/markdown';
import oid2ts from '@/shared/lib/oid2ts';
import type { SolutionDoc } from '@/shared/types/problem';
import type { ObjectId } from '@/shared/types/shared';
import type { BaseUserDict } from '@/shared/types/user';
import dayjs from 'dayjs';

type Props = {
  solution: SolutionDoc;
  udict: BaseUserDict;
  pssdict: Record<string, { docId: ObjectId; vote: number }>;
  pid: string | number;
};

export default function SolutionItem({ solution, udict, pssdict, pid }: Props) {
  const user = udict[solution.owner];
  const vote = solution.vote;
  const userVote = (pssdict[solution.docId]?.vote ?? 0) as 0 | 1 | -1;
  const createdAtMs = oid2ts(solution._id);
  const createdAt = Number.isFinite(createdAtMs)
    ? dayjs(createdAtMs).format('YYYY/MM/DD HH:mm')
    : '';

  return (
    <div className="space-y-3" data-llm-visible="true">
      <div className="text-muted-foreground flex items-center justify-between gap-x-3 overflow-hidden whitespace-nowrap text-xs">
        <div className="flex items-center gap-x-3">
          <SolutionVote
            pid={pid}
            sid={solution.docId}
            initialVote={vote}
            initialUserVote={userVote}
          />
          {user && <UserSpan user={user} showAvatar />}
        </div>
        <span>{createdAt}</span>
      </div>

      <Markdown>{solution.content}</Markdown>
    </div>
  );
}

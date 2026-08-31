import SolutionDeleteButton from './solution-delete-button';
import SolutionVote from './solution-vote';
import UserSpan from '@/features/user/user-span';
import Markdown from '@/shared/components/markdown';
import { Button } from '@/shared/components/ui/button';
import oid2ts from '@/shared/lib/oid2ts';
import type { SolutionDoc } from '@/shared/types/problem';
import type { ObjectId } from '@/shared/types/shared';
import type { BaseUserDict } from '@/shared/types/user';
import dayjs from 'dayjs';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = {
  solution: SolutionDoc;
  udict: BaseUserDict;
  pssdict: Record<string, { docId: ObjectId; vote: number }>;
  pid: string | number;
  viewerId?: number;
  allowEditAny: boolean;
  allowEditSelf: boolean;
  allowDeleteAny: boolean;
  allowDeleteSelf: boolean;
};

export default function SolutionItem({
  solution,
  udict,
  pssdict,
  pid,
  viewerId,
  allowEditAny,
  allowEditSelf,
  allowDeleteAny,
  allowDeleteSelf,
}: Props) {
  const t = useTranslations('solution');
  const user = udict[solution.owner];
  const vote = solution.vote;
  const userVote = (pssdict[solution.docId]?.vote ?? 0) as 0 | 1 | -1;
  const createdAtMs = oid2ts(solution._id);
  const createdAt = Number.isFinite(createdAtMs)
    ? dayjs(createdAtMs).format('YYYY/MM/DD HH:mm')
    : '';
  const canEdit =
    allowEditAny || (allowEditSelf && viewerId === solution.owner);
  const canDelete =
    allowDeleteAny || (allowDeleteSelf && viewerId === solution.owner);

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
        <div className="flex items-center gap-x-1">
          <span className="flex items-center text-sm">{createdAt}</span>
          {canEdit && (
            <Button
              asChild
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label={t('edit')}
              title={t('edit')}
            >
              <Link
                href={`/problem/${pid}/solution/${solution.docId}/edit`}
                prefetch={false}
              >
                <Pencil strokeWidth={2} />
                <span className="sr-only" data-llm-text={t('edit')}>
                  {t('edit')}
                </span>
              </Link>
            </Button>
          )}
          {canDelete && (
            <SolutionDeleteButton pid={pid} psid={solution.docId} />
          )}
        </div>
      </div>

      <Markdown>{solution.content}</Markdown>
    </div>
  );
}

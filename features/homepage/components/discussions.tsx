import UserSpan from '@/features/user/user-span';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import type { Discussion } from '@/shared/types/discussion';
import type { BaseUserDict } from '@/shared/types/user';
import dayjs from 'dayjs';
import { Calendar, MessageCircle, Eye, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  discussions: Discussion[];
  udict: BaseUserDict;
};

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3.5" />
      <span className="tabular-nums">{children}</span>
    </span>
  );
}

function DiscussionRow({
  discussion,
  udict,
}: {
  discussion: Discussion;
  udict: BaseUserDict;
}) {
  const user = udict[discussion.owner]!;
  const updatedAt = dayjs(discussion.updateAt).isValid()
    ? dayjs(discussion.updateAt).format('YYYY-MM-DD')
    : '';

  return (
    <div data-llm-visible="true" className="space-y-1.5">
      <p
        data-llm-text={discussion.title}
        className="text-foreground overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap"
      >
        <Link
          href={`/discussion/${discussion.docId}`}
          className="hover:underline"
        >
          {discussion.title}
        </Link>
      </p>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <UserSpan user={user} showAvatar />
        <MetaItem icon={MessageCircle}>
          <span data-llm-text={String(discussion.nReply)}>
            {discussion.nReply}
          </span>
        </MetaItem>
        <MetaItem icon={Eye}>
          <span data-llm-text={String(discussion.views)}>
            {discussion.views}
          </span>
        </MetaItem>
        {updatedAt && (
          <MetaItem icon={Calendar}>
            <span data-llm-text={updatedAt}>{updatedAt}</span>
          </MetaItem>
        )}
      </div>
    </div>
  );
}

export default function Discussions({ discussions, udict }: Props) {
  if (!discussions.length) return null;

  const lastIndexByColumn: Record<number, number> = { 0: -1, 1: -1 };
  discussions.forEach((_, index) => {
    lastIndexByColumn[index % 2] = index;
  });

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="size-5" />
          <span data-llm-text="最近讨论">最近讨论</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {discussions.map((discussion, index) => {
            const isLastOverall = index === discussions.length - 1;
            const isLastInColumn = index === lastIndexByColumn[index % 2];

            return (
              <div
                key={discussion.docId}
                className={cn(
                  !isLastOverall && 'border-b pb-4',
                  'sm:border-b-0 sm:pb-0',
                  !isLastInColumn && 'sm:border-b sm:pb-4'
                )}
              >
                <DiscussionRow discussion={discussion} udict={udict} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import type { DiscussionMainResponse } from '@/api/server/method/discussion/main';
import UserAvatar from '@/features/user/user-avatar';
import { Badge } from '@/shared/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import type { Discussion } from '@/shared/types/discussion';
import dayjs from 'dayjs';
import { MessageCircle, Eye, Pin, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

type Props = {
  data: DiscussionMainResponse;
};

function getNodeTitle(
  discussion: Discussion,
  vndict: DiscussionMainResponse['vndict']
): string {
  const vnode = vndict[discussion.parentType]?.[discussion.parentId];
  if (!vnode) return '未知节点';
  return (vnode as { title?: string }).title || '未知节点';
}

function DiscussionItem({
  discussion,
  udict,
  vndict,
}: {
  discussion: Discussion;
  udict: DiscussionMainResponse['udict'];
  vndict: DiscussionMainResponse['vndict'];
}) {
  const owner = udict[discussion.owner];
  const nodeTitle = getNodeTitle(discussion, vndict);
  const discussionHref = `/discussion/${discussion.docId}`;
  const updatedAt = dayjs(discussion.updateAt).format('YYYY-MM-DD HH:mm');

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="flex items-start gap-3">
        {owner && (
          <UserAvatar user={owner} className="size-11 shrink-0 self-center" />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={discussionHref}
              data-llm-text={discussion.title}
              className="text-sm font-medium text-foreground hover:text-primary hover:underline md:text-base"
            >
              {discussion.pin && (
                <Badge
                  variant="secondary"
                  className="mr-2 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                >
                  <Pin data-icon="inline-start" />
                  置顶
                </Badge>
              )}
              {discussion.highlight && (
                <Badge
                  variant="secondary"
                  className="mr-2 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                >
                  <Star data-icon="inline-start" />
                  精华
                </Badge>
              )}
              {discussion.title}
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <Badge variant="secondary" title="讨论节点">
                <span data-llm-text={nodeTitle}>{nodeTitle}</span>
              </Badge>
              <Badge variant="secondary" title="回复数">
                <MessageCircle data-icon="inline-start" />
                <span
                  data-llm-text={String(discussion.nReply)}
                  className="tabular-nums"
                >
                  {discussion.nReply}
                </span>
              </Badge>
              <Badge variant="secondary" title="浏览量">
                <Eye data-icon="inline-start" />
                <span
                  data-llm-text={String(discussion.views)}
                  className="tabular-nums"
                >
                  {discussion.views}
                </span>
              </Badge>
              <span className="text-muted-foreground" title="更新时间">
                {updatedAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscussionList({ data }: Props) {
  if (!data.ddocs.length) {
    return (
      <Empty className="border border-dashed" data-llm-visible="true">
        <EmptyMedia variant="icon">
          <Search strokeWidth={2} />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无讨论">暂无讨论</EmptyTitle>
          <EmptyDescription data-llm-text="暂无讨论">
            暂时没有讨论，快来发起第一个话题吧！
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border bg-card/40"
      data-llm-visible="true"
    >
      {data.ddocs.map((discussion, index) => (
        <Fragment key={discussion.docId}>
          <div className="px-4 py-4 transition-colors hover:bg-accent/30 sm:px-5">
            <DiscussionItem
              discussion={discussion}
              udict={data.udict}
              vndict={data.vndict}
            />
          </div>
          {index < data.ddocs.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  );
}

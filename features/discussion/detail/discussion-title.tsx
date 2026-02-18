import UserAvatar from '@/features/user/user-avatar';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import type {
  DiscussionDetailVnode,
  DiscussionDoc,
} from '@/shared/types/discussion';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';
import { Calendar, Eye, MessageCircle, Pin, Star } from 'lucide-react';

type Props = {
  ddoc: DiscussionDoc;
  owner?: BaseUser;
  vnode: DiscussionDetailVnode;
  drcount: number;
};

function getVnodeTitle(vnode: DiscussionDetailVnode): string | null {
  if (!vnode || typeof vnode !== 'object' || Array.isArray(vnode)) return null;
  const title = 'title' in vnode ? vnode.title : undefined;
  if (typeof title !== 'string') return null;

  const normalized = title.trim();
  return normalized.length ? normalized : null;
}

export default function DiscussionTitle({
  ddoc,
  owner,
  vnode,
  drcount,
}: Props) {
  const updatedAt = dayjs(ddoc.updateAt);
  const updatedAtText = updatedAt.isValid()
    ? updatedAt.format('YYYY-MM-DD HH:mm')
    : '';
  const vnodeTitle = getVnodeTitle(vnode);
  const replyCount = Number.isFinite(drcount) ? drcount : ddoc.nReply;

  return (
    <section data-llm-visible="true" className="space-y-2 border-b pb-4">
      <div className="flex items-start gap-3">
        {owner && (
          <UserAvatar user={owner} className="size-11 shrink-0 self-center" />
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="text-lg leading-snug font-medium md:text-xl">
            {ddoc.pin && (
              <Badge
                variant="secondary"
                className="mr-2 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
              >
                <Pin data-icon="inline-start" />
                置顶
              </Badge>
            )}
            {ddoc.highlight && (
              <Badge
                variant="secondary"
                className="mr-2 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
              >
                <Star data-icon="inline-start" />
                精华
              </Badge>
            )}
            <span data-llm-text={ddoc.title}>{ddoc.title}</span>
          </div>

          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {owner && (
              <span data-llm-text={owner.uname}>
                <UserSpan user={owner} showAvatar={false} />
              </span>
            )}

            {vnodeTitle && (
              <Badge variant="secondary" title="讨论节点">
                <span data-llm-text={vnodeTitle}>{vnodeTitle}</span>
              </Badge>
            )}

            <Badge variant="secondary" title="回复数">
              <MessageCircle data-icon="inline-start" />
              <span data-llm-text={String(replyCount)} className="tabular-nums">
                {replyCount}
              </span>
            </Badge>

            <Badge variant="secondary" title="浏览量">
              <Eye data-icon="inline-start" />
              <span data-llm-text={String(ddoc.views)} className="tabular-nums">
                {ddoc.views}
              </span>
            </Badge>

            {updatedAtText && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                <span data-llm-text={updatedAtText}>{updatedAtText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

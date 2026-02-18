import UserSpan from '@/features/user/user-span';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import type { Blog } from '@/shared/types/blog';
import type { BaseUserDict } from '@/shared/types/user';
import dayjs from 'dayjs';
import {
  Calendar,
  MessageCircle,
  Eye,
  Heart,
  Notebook,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import removeMd from 'remove-markdown';

type Props = {
  blogs: Blog[];
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

function BlogRow({ blog, udict }: { blog: Blog; udict: BaseUserDict }) {
  const user = udict[blog.owner]!;
  const excerpt = removeMd(blog.content, {
    stripListLeaders: true,
    listUnicodeChar: '',
    gfm: true,
    useImgAltText: true,
  })
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
  const publishedAt = dayjs(blog.updateAt).isValid()
    ? dayjs(blog.updateAt).format('YYYY-MM-DD')
    : '';

  return (
    <div data-llm-visible="true" className="space-y-2">
      <div className="space-y-1">
        <p
          data-llm-text={blog.title}
          className="text-foreground overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap"
        >
          {blog.title}
        </p>
        {excerpt && (
          <p
            data-llm-text={excerpt}
            className="text-muted-foreground overflow-hidden text-sm text-ellipsis whitespace-nowrap"
          >
            {excerpt}
          </p>
        )}
      </div>

      <div className="text-muted-foreground flex items-center gap-x-3 overflow-hidden whitespace-nowrap text-xs">
        <UserSpan user={user} showAvatar />
        {blog.category && <MetaItem icon={Tag}>{blog.category}</MetaItem>}
        <MetaItem icon={Eye}>{blog.views}</MetaItem>
        <MetaItem icon={MessageCircle}>{blog.nReply}</MetaItem>
        <MetaItem icon={Heart}>{blog.likeCount}</MetaItem>
        {publishedAt && <MetaItem icon={Calendar}>{publishedAt}</MetaItem>}
      </div>
    </div>
  );
}

export default function RecentBlogs({ blogs, udict }: Props) {
  if (!blogs.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Notebook className="size-5" />
          最新博客
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blogs.map((blog, index) => (
            <div
              key={blog.docId}
              className={cn(index !== blogs.length - 1 && 'border-b pb-4')}
            >
              <BlogRow blog={blog} udict={udict} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

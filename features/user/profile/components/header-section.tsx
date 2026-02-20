import {
  formatTime,
  getProfileExtras,
  getProfileUser,
  type UserProfileProps,
} from './shared';
import UserAvatar from '@/features/user/user-avatar';
import { Badge } from '@/shared/components/ui/badge';
import { AtSign, BarChart3, Calendar, Clock3 } from 'lucide-react';

export default function HeaderSection({ data }: UserProfileProps) {
  const profileUser = getProfileUser(data);
  const extras = getProfileExtras(data);

  const acceptCount = extras.nAccept ?? data.pdocs.length;
  const submitCount = extras.nSubmit;
  const acceptanceRate =
    submitCount && submitCount > 0
      ? `${Math.round((acceptCount * 100) / submitCount)}%`
      : '-';

  return (
    <section className="border-b pb-6" data-llm-visible="true">
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-r from-muted/40 via-background to-background px-4 py-5 sm:px-6">
        <div className="bg-primary/10 absolute -top-10 -right-10 size-32 rounded-full blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <UserAvatar user={profileUser} className="size-16 border" />
              <div className="min-w-0">
                <h1
                  className="truncate text-2xl leading-snug font-medium"
                  data-llm-text={data.udoc.uname}
                >
                  {data.udoc.uname}
                </h1>
                <p
                  className="text-sm text-muted-foreground"
                  data-llm-text={String(data.udoc._id)}
                >
                  UID {data.udoc._id}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data.isSelfProfile && (
                <Badge variant="secondary" data-llm-text="我的主页">
                  我的主页
                </Badge>
              )}
              {extras.rp !== undefined && (
                <Badge
                  variant="secondary"
                  data-llm-text={String(Math.round(extras.rp))}
                >
                  RP {Math.round(extras.rp)}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <div className="inline-flex items-center gap-2">
              <AtSign className="size-4" />
              <span data-llm-text={data.udoc.mail || '-'}>
                {data.udoc.mail || '-'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Calendar className="size-4" />
              <span data-llm-text={formatTime(data.udoc.regat)}>
                注册：{formatTime(data.udoc.regat)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              <span data-llm-text={formatTime(data.udoc.loginat)}>
                最近登录：{formatTime(data.udoc.loginat)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <BarChart3 className="size-4" />
              <span data-llm-text={acceptanceRate}>
                通过率：{acceptanceRate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

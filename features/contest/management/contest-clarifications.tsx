'use client';

import { getClarificationSubject, getObjectIdDate } from './management-utils';
import type { RenderedClarificationDoc } from './render-clarifications';
import ClientApis from '@/api/client/method';
import type { ContestClarificationResponse } from '@/api/server/method/contests/management';
import { getContestProblemLabel } from '@/features/contest/detail/contest-utils';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Empty, EmptyDescription } from '@/shared/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { MessageSquareText, Reply, Send } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  tid: string;
  data: ContestClarificationResponse;
  renderedDocs: RenderedClarificationDoc[];
};

export default function ContestClarifications({
  tid,
  data,
  renderedDocs,
}: Props) {
  const t = useTranslations('contestManagement');
  const format = useFormatter();
  const router = useRouter();
  const composerRef = useRef<HTMLElement>(null);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('0');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const replyIndex = replyTo
    ? data.tcdocs.findIndex((doc) => doc.docId === replyTo)
    : -1;
  const replyDoc = replyIndex >= 0 ? data.tcdocs[replyIndex] : null;

  const openComposer = (did?: string) => {
    setReplyTo(did ?? null);
    window.requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const submit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await ClientApis.Contest.postContestClarification(tid, content, {
        ...(replyTo ? { did: replyTo } : { subject: Number(subject) }),
      }).send();
      toast.success(replyTo ? t('replySent') : t('broadcastSent'));
      setContent('');
      setReplyTo(null);
      router.refresh();
    } catch {
      toast.error(t('actionFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6" data-llm-visible="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-semibold"
            data-llm-text={t('clarificationTitle')}
          >
            {t('clarificationTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('clarificationDescription')}
          </p>
        </div>
        <Button type="button" onClick={() => openComposer()}>
          <Send />
          {t('sendBroadcast')}
        </Button>
      </div>

      {data.tcdocs.length ? (
        <div className="divide-y overflow-hidden rounded-xl border">
          {data.tcdocs.map((doc, docIndex) => {
            const rendered = renderedDocs[docIndex];
            const clarificationSubject = getClarificationSubject(
              doc.subject,
              data.pdict[doc.subject]?.title
            );
            const owner = data.udict[doc.owner];
            const createdAt = getObjectIdDate(String(doc._id));

            return (
              <article
                key={doc._id}
                id={`clarification-${doc._id}`}
                className="space-y-4 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">
                      {clarificationSubject.type === 'problem'
                        ? clarificationSubject.title
                        : t(clarificationSubject.type)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {t('askedBy')}
                    </span>
                    {doc.owner === 0 ? (
                      <span className="font-medium">{t('jury')}</span>
                    ) : owner ? (
                      <UserSpan user={owner} showAvatar={false} />
                    ) : (
                      <span>{doc.owner}</span>
                    )}
                    {createdAt && (
                      <span className="text-muted-foreground">
                        ·{' '}
                        {format.dateTime(createdAt, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    )}
                  </div>
                  {doc.owner !== 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openComposer(doc.docId)}
                    >
                      <Reply />
                      {t('reply')}
                    </Button>
                  )}
                </div>

                <div className="min-w-0">{rendered?.content}</div>

                {!!doc.reply?.length && (
                  <div className="ml-4 space-y-3 border-l-2 border-primary/30 pl-4">
                    {doc.reply.map((reply, replyItemIndex) => (
                      <div
                        key={reply._id ?? replyItemIndex}
                        className="space-y-1"
                      >
                        <div className="text-xs font-medium text-muted-foreground">
                          {t('juryReply')}
                        </div>
                        {rendered?.replies[replyItemIndex]}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <Empty className="min-h-48 border">
          <MessageSquareText className="size-8 text-muted-foreground" />
          <EmptyDescription>{t('noClarifications')}</EmptyDescription>
        </Empty>
      )}

      <section
        ref={composerRef}
        className="scroll-mt-6 space-y-4 rounded-xl border p-5"
      >
        <div>
          <h2 className="text-lg font-semibold">
            {replyTo ? t('replyToClarification') : t('sendBroadcast')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {replyTo ? t('replyDescription') : t('broadcastDescription')}
          </p>
        </div>

        {replyDoc && (
          <div className="rounded-lg border-l-4 border-primary bg-muted/40 px-4 py-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {t('replyingTo')}
            </div>
            {renderedDocs[replyIndex]?.content}
          </div>
        )}

        {!replyTo && (
          <label className="block space-y-2 text-sm font-medium">
            <span>{t('subject')}</span>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('general')}</SelectItem>
                <SelectItem value="-1">{t('technical')}</SelectItem>
                {data.tdoc.pids.map((pid, index) => (
                  <SelectItem key={pid} value={String(pid)}>
                    {getContestProblemLabel(index)}.{' '}
                    {data.pdict[pid]?.title || `#${pid}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        <label className="block space-y-2 text-sm font-medium">
          <span>{t('content')}</span>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t('messagePlaceholder')}
            className="min-h-32"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!content.trim() || sending}
            onClick={() => void submit()}
          >
            <Send />
            {sending ? t('sending') : replyTo ? t('reply') : t('sendBroadcast')}
          </Button>
          {replyTo && (
            <Button
              type="button"
              variant="outline"
              disabled={sending}
              onClick={() => setReplyTo(null)}
            >
              {t('cancel')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

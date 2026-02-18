'use client';

import ClientApis from '@/api/client/method';
import UserAvatar from '@/features/user/user-avatar';
import UserSpan from '@/features/user/user-span';
import Pagination from '@/shared/components/pagination';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import oid2ts from '@/shared/lib/oid2ts';
import type { DiscussionReplyDoc } from '@/shared/types/discussion';
import type { ObjectId } from '@/shared/types/shared';
import type { BaseUser, BaseUserDict } from '@/shared/types/user';
import dayjs from 'dayjs';
import { MessageCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';

type Props = {
  did: string;
  drdocs: DiscussionReplyDoc[];
  udict: BaseUserDict;
  page: number;
  pcount: number;
  drcount: number;
  currentUser: BaseUser | null;
  canReply: boolean;
};

type RootFormData = {
  content: string;
};

type TailFormData = {
  content: string;
};

function formatObjectIdTime(value?: ObjectId) {
  if (!value) return '';
  const ts = oid2ts(value);
  if (!Number.isFinite(ts)) return '';
  const date = dayjs(ts);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '';
}

function getFloorReplyId(reply: DiscussionReplyDoc): ObjectId | undefined {
  return reply.docId || reply._id;
}

export default function DiscussionRepliesClient({
  did,
  drdocs,
  udict,
  page,
  pcount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  drcount,
  currentUser,
  canReply,
}: Props) {
  const router = useRouter();
  const [activeReplyId, setActiveReplyId] = useState<ObjectId | null>(null);
  const [rootSubmitting, setRootSubmitting] = useState(false);
  const [tailSubmittingId, setTailSubmittingId] = useState<ObjectId | null>(
    null
  );
  const [isRootFocused, setIsRootFocused] = useState(false);

  const rootForm = useForm<RootFormData>({
    defaultValues: {
      content: '',
    },
  });

  const tailForm = useForm<TailFormData>({
    defaultValues: {
      content: '',
    },
  });

  const handleRootSubmit = rootForm.handleSubmit(async (data) => {
    if (!canReply || rootSubmitting) return;

    const content = data.content.trim();
    if (!content) {
      rootForm.setError('content', { message: '评论内容不能为空' });
      return;
    }

    setRootSubmitting(true);

    try {
      await ClientApis.Discussion.replyDiscussion(did, content).send();
      rootForm.reset();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '评论发布失败，请稍后重试';
      rootForm.setError('content', { message });
    } finally {
      setRootSubmitting(false);
    }
  });

  const handleTailSubmit = (drid: ObjectId) =>
    tailForm.handleSubmit(async (data) => {
      if (!canReply || tailSubmittingId) return;

      const content = data.content.trim();
      if (!content) {
        tailForm.setError('content', { message: '回复内容不能为空' });
        return;
      }

      setTailSubmittingId(drid);

      try {
        await ClientApis.Discussion.replyDiscussionTail(
          did,
          drid,
          content
        ).send();
        tailForm.reset();
        setActiveReplyId(null);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '回复失败，请稍后重试';
        tailForm.setError('content', { message });
      } finally {
        setTailSubmittingId(null);
      }
    });

  const handleReplyClick = (floorId: ObjectId) => {
    setActiveReplyId((prev) => {
      const isClosing = prev === floorId;
      if (isClosing) {
        tailForm.reset();
      } else {
        tailForm.reset({ content: '' });
      }
      return isClosing ? null : floorId;
    });
  };

  const rootError = rootForm.formState.errors.content?.message;
  const tailError = tailForm.formState.errors.content?.message;

  const showRootSubmitButton = isRootFocused || rootSubmitting;

  return (
    <section className="space-y-6" data-llm-visible="true">
      <Separator />
      <form onSubmit={handleRootSubmit}>
        <div className="flex items-start gap-3">
          <UserAvatar user={currentUser!} className="size-10 shrink-0" />

          <div className="min-w-0 flex-1 space-y-3">
            <Textarea
              {...rootForm.register('content')}
              disabled={!canReply || rootSubmitting}
              placeholder={
                canReply ? '发一条友善的评论吧...' : '你当前没有评论权限'
              }
              className="min-h-24 resize-y"
              onFocus={() => setIsRootFocused(true)}
            />
            {showRootSubmitButton && (
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-destructive min-h-5 text-xs"
                  data-llm-text={rootError || ''}
                >
                  {rootError}
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                  disabled={!canReply || rootSubmitting}
                >
                  <Send strokeWidth={2} />
                  <span data-llm-text={rootSubmitting ? '发布中...' : '发布'}>
                    {rootSubmitting ? '发布中...' : '发布'}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </form>

      {!drdocs.length ? (
        <Empty data-llm-visible="true">
          <EmptyMedia variant="icon">
            <MessageCircle strokeWidth={2} />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle data-llm-text="暂无评论">暂无评论</EmptyTitle>
            <EmptyDescription data-llm-text="还没有人评论，快来抢沙发吧">
              还没有人评论，快来抢沙发吧。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-0" data-llm-visible="true">
          {drdocs.map((floorReply) => {
            const floorId = getFloorReplyId(floorReply);
            const owner = udict[floorReply.owner!];
            const floorTime = formatObjectIdTime(
              floorReply._id || floorReply.docId
            );
            const floorTailReplies = floorReply.reply ?? [];
            const replyFormVisible = !!floorId && activeReplyId === floorId;
            const tailSubmitting = !!floorId && tailSubmittingId === floorId;

            return (
              <Fragment key={floorReply.docId}>
                <article className="space-y-3 py-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={owner} className="size-10 shrink-0" />

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <UserSpan user={owner} showAvatar={false} />
                      </div>

                      <p
                        className="text-sm leading-6 whitespace-pre-wrap wrap-break-word"
                        data-llm-text={floorReply.content}
                      >
                        {floorReply.content}
                      </p>

                      <div className="flex items-center gap-3">
                        {floorTime && (
                          <span
                            className="text-muted-foreground text-sm"
                            data-llm-text={floorTime}
                          >
                            {floorTime}
                          </span>
                        )}
                        {floorId && canReply && (
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => handleReplyClick(floorId)}
                            className="cursor-pointer"
                          >
                            <span
                              data-llm-text={
                                replyFormVisible ? '取消回复' : '回复'
                              }
                            >
                              {replyFormVisible ? '取消回复' : '回复'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {(floorTailReplies.length > 0 || replyFormVisible) && (
                    <div className="ml-12 space-y-3 border-l-2 border-dashed pl-4">
                      {floorTailReplies.map((tailReply) => {
                        const tailOwner = udict[tailReply.owner];
                        const tailTime = formatObjectIdTime(tailReply._id);

                        return (
                          <div key={tailReply._id} className="space-y-1.5">
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                              <UserSpan user={tailOwner} />
                              {tailTime && (
                                <span data-llm-text={tailTime}>{tailTime}</span>
                              )}
                            </div>
                            <p
                              className="text-sm leading-6 whitespace-pre-wrap wrap-break-word"
                              data-llm-text={tailReply.content}
                            >
                              {tailReply.content}
                            </p>
                          </div>
                        );
                      })}

                      {replyFormVisible && floorId && (
                        <form
                          onSubmit={handleTailSubmit(floorId)}
                          className="space-y-2 pt-2"
                        >
                          <Textarea
                            {...tailForm.register('content')}
                            disabled={tailSubmitting}
                            placeholder="回复该评论..."
                            className="min-h-20 resize-y"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="text-destructive min-h-5 text-xs"
                              data-llm-text={tailError || ''}
                            >
                              {tailError}
                            </p>
                            <Button
                              type="submit"
                              size="xs"
                              className="gap-1.5"
                              disabled={tailSubmitting}
                            >
                              <Send strokeWidth={2} />
                              <span
                                data-llm-text={
                                  tailSubmitting ? '回复中...' : '回复'
                                }
                              >
                                {tailSubmitting ? '回复中...' : '回复'}
                              </span>
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              </Fragment>
            );
          })}
        </div>
      )}

      <div className="pt-1">
        <Pagination page={page} totalPages={pcount} />
      </div>
    </section>
  );
}

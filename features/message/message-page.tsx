'use client';

import { useMessageRealtime } from './message-realtime-context';
import {
  appendMessage,
  formatMessageContent,
  messageSummary,
  parseMessageTarget,
  sortDialogues,
  sortMessages,
} from './message-utils';
import ClientApis from '@/api/client/method';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import SingleUserAutoComplete from '@/features/user/user-auto-complete';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import type {
  MessageDialogue,
  MessageDoc,
  MessagesResponse,
} from '@/shared/types/message';
import { LoaderCircle, Plus, Send, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  currentUser: {
    _id: number;
    avatarUrl?: string;
    uname: string;
  };
  domainId: string;
  initialData: MessagesResponse;
};

function dialogueFromUser(user: UserAutoCompleteItem): MessageDialogue {
  return {
    _id: user._id,
    udoc: user,
    messages: [],
  };
}

function isAtBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 160;
}

export default function MessagePage({
  currentUser,
  domainId,
  initialData,
}: Props) {
  const t = useTranslations('messages');
  const locale = useLocale() === 'zh' ? 'zh' : 'en';
  const searchParams = useSearchParams();
  const realtime = useMessageRealtime();
  const [dialogues, setDialogues] = useState<Record<number, MessageDialogue>>(
    () =>
      Object.fromEntries(
        Object.values(initialData.messages).map((dialogue) => [
          dialogue._id,
          { ...dialogue, messages: sortMessages(dialogue.messages) },
        ])
      )
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [recipient, setRecipient] = useState('');
  const [selectingRecipient, setSelectingRecipient] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const targetRef = useRef<number | null>(null);

  const orderedDialogues = useMemo(
    () => sortDialogues(Object.values(dialogues)),
    [dialogues]
  );
  const activeDialogue = activeId ? dialogues[activeId] : null;

  const addDialogue = useCallback((user: UserAutoCompleteItem) => {
    setDialogues((previous) => ({
      ...previous,
      [user._id]: previous[user._id] ?? dialogueFromUser(user),
    }));
    setActiveId(user._id);
  }, []);

  const resolveUser = useCallback(
    async (uid: number) => {
      const users = await ClientApis.User.getUsersByIds(domainId, [
        String(uid),
      ]).send();
      const user = users.find((item) => item._id === uid);
      if (user) addDialogue(user);
    },
    [addDialogue, domainId]
  );

  useEffect(() => {
    const target = parseMessageTarget(searchParams);
    if (!target || target === targetRef.current) return;
    targetRef.current = target;
    if (dialogues[target]) {
      const timer = window.setTimeout(() => setActiveId(target), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void resolveUser(target).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dialogues, resolveUser, searchParams]);

  useEffect(() => {
    realtime?.markMessagesRead();
    return realtime?.subscribe((event) => {
      const counterpart = event.udoc._id;
      setDialogues((previous) => {
        const existing = previous[counterpart];
        return {
          ...previous,
          [counterpart]: {
            _id: counterpart,
            udoc: event.udoc,
            messages: appendMessage(existing?.messages ?? [], event.mdoc),
          },
        };
      });
    });
  }, [realtime]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || !shouldScrollRef.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [activeId, activeDialogue?.messages.length]);

  const createDialogue = async () => {
    const value = recipient.trim();
    if (!value || selectingRecipient) return;
    setSelectingRecipient(true);
    try {
      const users = /^\d+$/.test(value)
        ? await ClientApis.User.getUsersByIds(domainId, [value]).send()
        : await ClientApis.User.searchUsers(domainId, value).send();
      const user = users.find(
        (item) => String(item._id) === value || item.uname === value
      );
      if (!user) {
        toast.error(t('recipientNotFound'));
        return;
      }
      addDialogue(user);
      setRecipient('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loadFailed'));
    } finally {
      setSelectingRecipient(false);
    }
  };

  const send = async () => {
    if (!activeDialogue || !draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const response = await ClientApis.Messages.sendMessage(
        activeDialogue._id,
        draft
      ).send();
      setDialogues((previous) => ({
        ...previous,
        [activeDialogue._id]: {
          ...previous[activeDialogue._id],
          messages: appendMessage(
            previous[activeDialogue._id].messages,
            response.mdoc
          ),
        },
      }));
      setDraft('');
      shouldScrollRef.current = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('sendFailed');
      setSendError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="grid h-[calc(100dvh-9.5rem)] min-h-0 overflow-hidden rounded-lg border bg-background md:h-[calc(100dvh-5rem)] lg:grid-cols-[18rem_minmax(0,1fr)]"
      data-llm-visible="true"
    >
      <aside className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
          <h1 className="font-semibold" data-llm-text={t('title')}>
            {t('title')}
          </h1>
          <Button
            size="sm"
            onClick={() => setActiveId(null)}
            aria-label={t('new')}
            title={t('new')}
          >
            <Plus aria-hidden="true" />
            {t('new')}
          </Button>
        </div>
        <div className="min-h-0 max-h-72 flex-1 overflow-y-auto lg:max-h-none">
          {!orderedDialogues.length ? (
            <p
              className="p-4 text-sm text-muted-foreground"
              data-llm-text={t('noConversations')}
            >
              {t('noConversations')}
            </p>
          ) : (
            orderedDialogues.map((dialogue) => {
              const latest = dialogue.messages.at(-1);
              return (
                <button
                  key={dialogue._id}
                  type="button"
                  onClick={() => setActiveId(dialogue._id)}
                  className={cn(
                    'hover:bg-muted flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors',
                    activeId === dialogue._id && 'bg-muted'
                  )}
                >
                  <MessageAvatar user={dialogue.udoc} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-medium"
                      data-llm-text={dialogue.udoc.uname}
                    >
                      {dialogue.udoc.uname}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      data-llm-text={messageSummary(latest, locale)}
                    >
                      {messageSummary(latest, locale)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>
      <div className="flex min-h-0 flex-col">
        {activeDialogue ? (
          <>
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <Link
                href={`/user/${activeDialogue.udoc._id}`}
                className="min-w-0 truncate text-sm font-medium hover:underline"
              >
                {activeDialogue.udoc.uname} (
                {t('userId', { id: activeDialogue.udoc._id })})
              </Link>
              <Button asChild variant="ghost" size="icon-sm">
                <Link
                  href={`/user/${activeDialogue.udoc._id}`}
                  aria-label={t('viewProfile')}
                  title={t('viewProfile')}
                >
                  <UserRound aria-hidden="true" />
                </Link>
              </Button>
            </header>
            <div
              ref={contentRef}
              onScroll={(event) => {
                shouldScrollRef.current = isAtBottom(event.currentTarget);
              }}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
            >
              {sortMessages(activeDialogue.messages).map((message) => (
                <MessageBubble
                  key={message._id}
                  currentUser={currentUser}
                  dialogue={activeDialogue}
                  locale={locale}
                  message={message}
                />
              ))}
            </div>
            <div className="flex min-h-36 flex-col border-t p-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    (event.ctrlKey || event.metaKey)
                  ) {
                    event.preventDefault();
                    void send();
                  }
                }}
                disabled={sending}
                placeholder={t('composePlaceholder')}
                aria-label={t('composePlaceholder')}
                className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 dark:disabled:bg-transparent"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p
                  className="min-w-0 truncate text-xs text-destructive"
                  role="status"
                >
                  {sendError}
                </p>
                <Button
                  disabled={sending || !draft.trim()}
                  onClick={() => void send()}
                >
                  {sending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  {sending ? t('sending') : t('send')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-center p-6">
            <div className="mx-auto w-full max-w-md space-y-3">
              <h2 className="text-lg font-semibold">{t('newConversation')}</h2>
              <SingleUserAutoComplete
                domainId={domainId}
                value={recipient}
                onValueChange={setRecipient}
                placeholder={t('selectRecipient')}
                ariaLabel={t('selectRecipient')}
                disabled={selectingRecipient}
                inputClassName="border-0 bg-muted/40 shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
              <Button
                onClick={() => void createDialogue()}
                disabled={!recipient.trim() || selectingRecipient}
              >
                {selectingRecipient && (
                  <LoaderCircle className="animate-spin" />
                )}
                {t('startConversation')}
              </Button>
              {orderedDialogues.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('noConversationSelected')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MessageAvatar({
  user,
}: {
  user: { avatarUrl?: string; uname: string };
}) {
  return (
    <Avatar className="size-9 shrink-0">
      <AvatarImage src={user.avatarUrl} alt={user.uname} />
      <AvatarFallback>{user.uname.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function MessageBubble({
  currentUser,
  dialogue,
  locale,
  message,
}: {
  currentUser: Props['currentUser'];
  dialogue: MessageDialogue;
  locale: 'en' | 'zh';
  message: MessageDoc;
}) {
  const own = message.from === currentUser._id;
  const content = formatMessageContent(message, locale).text;
  const date = new Date(Number.parseInt(message._id.slice(0, 8), 16) * 1_000);
  const time = Number.isNaN(date.getTime()) ? '' : date.toLocaleString(locale);
  const user = own
    ? { uname: currentUser.uname, avatarUrl: currentUser.avatarUrl }
    : dialogue.udoc;

  return (
    <article className={cn('group flex gap-2', own && 'flex-row-reverse')}>
      <MessageAvatar user={user} />
      <div className={cn('relative max-w-[80%] min-w-0', own && 'text-right')}>
        <div
          className={cn(
            'inline-block whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm text-left',
            own ? 'bg-muted' : 'bg-primary text-primary-foreground'
          )}
          data-llm-text={content}
        >
          {content}
        </div>
        {time && (
          <time
            className={cn(
              'pointer-events-none invisible absolute top-full whitespace-nowrap text-xs text-muted-foreground opacity-0 transition-opacity group-hover:visible group-hover:opacity-100',
              own ? 'right-0' : 'left-0'
            )}
          >
            {time}
          </time>
        )}
      </div>
    </article>
  );
}

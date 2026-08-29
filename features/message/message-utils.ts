import {
  MessageFlag,
  type MessageDialogue,
  type MessageDoc,
} from '@/shared/types/message';

type I18nPayload = {
  message?: string;
  params?: unknown[] | Record<string, unknown>;
  url?: string;
  avatar?: string;
};

const systemTranslations: Record<string, Record<'en' | 'zh', string>> = {
  'Judge Result\n{0}: {1}': {
    en: 'Judge Result\n{0}: {1}',
    zh: '评测结果\n{0}: {1}',
  },
  'First Blood Notice\n{0} solved problem {1} ({2})': {
    en: 'First Blood Notice\n{0} solved problem {1} ({2})',
    zh: '一血通知\n{0} 通过了第 {1} 题（{2}）',
  },
  'Contest {0} has a new clarification about {1}, please go to contest clarifications page to reply.':
    {
      en: 'Contest {0} has a new clarification about {1}, please go to contest clarifications page to reply.',
      zh: '比赛 {0} 收到关于 {1} 的新澄清，请前往比赛澄清页面回复。',
    },
  'Contest {0} jury replied to your clarification, please go to contest page to view.':
    {
      en: 'Contest {0} jury replied to your clarification, please go to contest page to view.',
      zh: '比赛 {0} 的裁判回复了你的澄清，请前往比赛页面查看。',
    },
  'Broadcast message from contest {0}:\n{1}': {
    en: 'Broadcast message from contest {0}:\n{1}',
    zh: '来自比赛 {0} 的广播消息：\n{1}',
  },
};

export function objectIdTimestamp(id: string): number {
  const timestamp = Number.parseInt(id.slice(0, 8), 16);
  return Number.isFinite(timestamp) ? timestamp * 1000 : 0;
}

export function sortMessages(messages: MessageDoc[]): MessageDoc[] {
  return [...messages].sort((left, right) => {
    const timeDiff = objectIdTimestamp(left._id) - objectIdTimestamp(right._id);
    if (timeDiff !== 0) return timeDiff;
    return left._id.localeCompare(right._id);
  });
}

export function sortDialogues(dialogues: MessageDialogue[]): MessageDialogue[] {
  return [...dialogues].sort((left, right) => {
    const leftLatest = Math.max(
      0,
      ...left.messages.map((message) => objectIdTimestamp(message._id))
    );
    const rightLatest = Math.max(
      0,
      ...right.messages.map((message) => objectIdTimestamp(message._id))
    );
    return rightLatest - leftLatest;
  });
}

export function appendMessage(
  messages: MessageDoc[],
  message: MessageDoc
): MessageDoc[] {
  return messages.some(({ _id }) => _id === message._id)
    ? messages
    : [...messages, message];
}

export function parseMessageTarget(
  searchParams: Pick<URLSearchParams, 'get'>
): number | null {
  const value = searchParams.get('target') ?? searchParams.get('uid');
  if (!value || !/^\d+$/.test(value)) return null;
  const target = Number(value);
  return Number.isSafeInteger(target) && target > 0 ? target : null;
}

function interpolate(template: string, params?: I18nPayload['params']): string {
  if (!params) return template;
  return template.replace(/\{([^{}]+)\}/g, (match, key) => {
    const value = Array.isArray(params)
      ? params[Number(key)]
      : params[key as keyof typeof params];
    return value === undefined || value === null ? match : String(value);
  });
}

export function parseSystemMessage(content: string): I18nPayload {
  try {
    const value: unknown = JSON.parse(content);
    if (value && typeof value === 'object') return value as I18nPayload;
  } catch {
    // The legacy backend may send an untranslated key directly.
  }
  return { message: content };
}

export function formatMessageContent(
  message: MessageDoc,
  locale: 'en' | 'zh'
): { text: string; url?: string; avatar?: string } {
  if (!(message.flag & MessageFlag.i18n) && message.from !== 1) {
    return { text: message.content };
  }
  const payload = parseSystemMessage(message.content);
  const key = payload.message ?? message.content;
  const template = systemTranslations[key]?.[locale] ?? key;
  return {
    text: interpolate(template, payload.params),
    url: payload.url,
    avatar: payload.avatar,
  };
}

export function messageSummary(
  message: MessageDoc | undefined,
  locale: 'en' | 'zh'
): string {
  if (!message) return '';
  if (message.flag & MessageFlag.richtext) {
    return locale === 'zh' ? '[富文本消息]' : '[Rich text message]';
  }
  return formatMessageContent(message, locale).text.replace(/\s+/g, ' ').trim();
}

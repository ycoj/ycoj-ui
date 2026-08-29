export const MessageFlag = {
  unread: 1,
  alert: 2,
  richtext: 4,
  info: 8,
  i18n: 16,
} as const;

export type MessageDoc = {
  _id: string;
  from: number;
  to: number | number[];
  content: string;
  flag: number;
};

export type MessageUser = {
  _id: number;
  uname: string;
  displayName?: string;
  avatar?: string;
  avatarUrl?: string;
};

export type MessageDialogue = {
  _id: number;
  udoc: MessageUser;
  messages: MessageDoc[];
};

export type MessagesResponse = {
  messages: Record<string, MessageDialogue>;
};

export type MessageEvent = {
  mdoc: MessageDoc;
  udoc: MessageUser;
};

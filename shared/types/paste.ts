export type PasteMode = 'code' | 'markdown';
export const PASTE_EXPIRE = ['day', 'week', 'month', 'never'] as const;
export type PasteExpire = (typeof PASTE_EXPIRE)[number];

export type PasteDoc = {
  _id: string;
  owner: number;
  title: string;
  mode: PasteMode;
  language: string;
  content: string;
  expire: PasteExpire;
  createdAt: string;
  updatedAt: string;
  expireAt?: string;
};

export type PasteFormOptions = {
  languageOptions: Record<string, string>;
  defaultExpire: PasteExpire;
  defaultLanguage: string;
};

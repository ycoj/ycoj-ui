export type PasteMode = 'code' | 'markdown';
export type PasteExpire = 'day' | 'week' | 'month' | 'never';

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
  expiryOptions: Record<PasteExpire, string>;
  languageOptions: Record<string, string>;
  defaultExpire: PasteExpire;
  defaultLanguage: string;
};

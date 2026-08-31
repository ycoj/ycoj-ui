import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

export const pasteOptions: PasteFormOptions = {
  expiryOptions: {
    day: '1 day',
    week: '1 week',
    month: '1 month',
    never: 'Never expire',
  },
  languageOptions: { cpp: 'C++', python: 'Python', javascript: 'JS' },
  defaultExpire: 'month',
  defaultLanguage: 'cpp',
};

export const pasteDoc: PasteDoc = {
  _id: 'abc123',
  owner: 1,
  title: 'Example',
  mode: 'code',
  language: 'python',
  content: '  print(1)\n\n',
  expire: 'week',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-30T00:00:00.000Z',
  expireAt: '2026-09-06T00:00:00.000Z',
};

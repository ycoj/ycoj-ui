import type { LanguageFamily } from '@/api/server/method/ui/languages';
import type { TestCaseResponse } from '@/shared/types/record';

export const PRETEST_CONTEST_ID = '000000000000000000000000';

export type ScratchpadLanguageOption = {
  familyKey: string;
  familyDisplay: string;
  name: string;
  display: string;
  pretest?: string | false;
  validAs?: string;
  hidden?: boolean;
};

export type ScratchpadLanguages = Record<string, LanguageFamily>;

export type ScratchpadTestcase = Pick<TestCaseResponse, 'message'>;

export type ScratchpadRecord = {
  _id: string;
  domainId: string;
  pid: number;
  uid: number;
  lang: string;
  score: number;
  memory: number;
  time: number;
  status: number;
  compilerTexts: string[];
  testCases: ScratchpadTestcase[];
  progress?: number;
  contest?: string;
};

export type ScratchpadEditorTheme = 'light' | 'dark' | 'system';

export type ScratchpadSettings = {
  fontSize: number;
  tabSize: number;
  theme: ScratchpadEditorTheme;
};

export type ScratchpadConfig = {
  pid: string;
  problemDocId: number;
  domainId: string;
  problemType: string;
  title: string;
  eventKind: 'standalone' | 'contest' | 'homework';
  tid?: string;
  userId: number;
  preferredLanguage?: string;
  codeTemplate?: string;
  languages: ScratchpadLanguages;
};

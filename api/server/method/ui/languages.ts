import { alova } from '@/api/server';

export type SubmitLanguage = {
  name: string;
  display: string;
};

export type LanguageFamily = {
  display: string;
  versions: SubmitLanguage[];
};

export type AvailableLanguagesResponse = {
  languages: Record<string, LanguageFamily>;
};

export const getAvailableLanguages = (pid?: number) =>
  alova.Get<AvailableLanguagesResponse>(`/ui/languages`, {
    params: { pid },
  });

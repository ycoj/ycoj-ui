export type SupportedProblemLanguage = 'zh' | 'zh_TW' | 'kr' | 'en' | 'jp';

export const PROBLEM_CONTENT_LANGUAGES: readonly SupportedProblemLanguage[] = [
  'zh',
  'zh_TW',
  'kr',
  'en',
  'jp',
];

export const PROBLEM_LANGUAGE_LABELS: Record<SupportedProblemLanguage, string> =
  {
    zh: '简体中文',
    zh_TW: '繁體中文',
    en: 'English',
    kr: '한국어',
    jp: '日本語',
  };

export type ProblemContentInLanguage = {
  language: SupportedProblemLanguage;
  content: string;
};
export type ProblemContent = ProblemContentInLanguage[];

export function parseProblemContent(content: string): ProblemContent {
  const raw = content.trim();
  if (!raw) return [];

  try {
    const record = JSON.parse(raw) as Partial<
      Record<SupportedProblemLanguage, string>
    >;
    return PROBLEM_CONTENT_LANGUAGES.flatMap((language) => {
      const text = record[language]?.trim();
      if (!text) return [];
      return [{ language, content: text }];
    });
  } catch {
    return [{ language: 'zh', content: raw }];
  }
}

export function serializeProblemContent(
  contents: Partial<Record<SupportedProblemLanguage, string>>
): string {
  const entries = PROBLEM_CONTENT_LANGUAGES.flatMap((language) => {
    const text = contents[language]?.trim();
    return text ? ([[language, text]] as const) : [];
  });
  if (!entries.length) return '';
  const [first] = entries;
  if (entries.length === 1 && first[0] === 'zh') return first[1];
  return JSON.stringify(Object.fromEntries(entries));
}

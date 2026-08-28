import type { LanguageFamily } from '@/api/client/method/ui/languages';

export type LanguageOption = {
  id: string;
  family: string;
  familyDisplay: string;
  display: string;
  invalid?: boolean;
};

export const languageLabel = (
  option: Pick<LanguageOption, 'familyDisplay' | 'display'>
) => `${option.familyDisplay} - ${option.display}`;

export function flattenLanguages(
  languages: Record<string, LanguageFamily>
): LanguageOption[] {
  return Object.entries(languages).flatMap(([family, info]) =>
    info.versions.map((version) => ({
      id: version.name,
      family,
      familyDisplay: info.display || family,
      display: version.display,
    }))
  );
}

export function filterLanguages(options: LanguageOption[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) =>
    [option.id, option.family, option.familyDisplay, option.display].some(
      (value) => value.toLowerCase().includes(normalized)
    )
  );
}

export function resolveLanguageOptions(
  options: LanguageOption[],
  ids: string[]
): LanguageOption[] {
  const optionsById = new Map(options.map((option) => [option.id, option]));

  return ids.map(
    (id) =>
      optionsById.get(id) ?? {
        id,
        family: id,
        familyDisplay: id,
        display: id,
        invalid: true,
      }
  );
}

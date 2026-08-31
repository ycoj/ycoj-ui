export function pasteLanguageLabel(
  language: string,
  languageOptions: Record<string, string>,
  plainText: string
) {
  if (!language) return plainText;
  return Object.hasOwn(languageOptions, language)
    ? languageOptions[language]
    : language;
}

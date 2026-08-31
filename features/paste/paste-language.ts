export function pasteLanguageLabel(
  language: string,
  names: Record<string, string>,
  plainText: string
) {
  if (!language) return plainText;
  return Object.hasOwn(names, language) ? names[language] : language;
}

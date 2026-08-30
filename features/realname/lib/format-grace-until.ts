export function formatGraceUntil(
  locale: string,
  graceUntil: string | null
): string | null {
  if (!graceUntil) return null;
  const date = new Date(graceUntil);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

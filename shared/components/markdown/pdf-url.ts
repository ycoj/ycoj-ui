const PDF_URL_BASE = 'https://pdf.invalid';

export function getSafePdfUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const url = value.trim();
  if (!url) return null;

  try {
    const protocol = new URL(url, PDF_URL_BASE).protocol;
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

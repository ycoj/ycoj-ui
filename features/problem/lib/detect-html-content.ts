import { parseProblemContent } from '@/features/problem/parse-problem-content';

const HTML_TAG_RE =
  /<(?:div|p|span|br|img|table|tr|td|th|tbody|thead|ul|ol|li|h[1-6]|pre|code|a|strong|em|b|i|u|font|section|article|blockquote|hr|sup|sub)\b[^>]*>/i;

const GENERIC_TAG_RE = /<[a-z][\s\S]*?>/i;

const ENTITY_RE = /&(?:lt|gt|amp|nbsp|quot);/i;

export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const entries = parseProblemContent(trimmed);
  const texts = entries.length > 0 ? entries.map((e) => e.content) : [trimmed];

  return texts.some((text) => {
    const t = text.trim();
    if (!t) return false;
    if (HTML_TAG_RE.test(t)) return true;
    if (ENTITY_RE.test(t) && GENERIC_TAG_RE.test(t)) return true;
    const tags = t.match(/<[^>]+>/g);
    if (tags && tags.length >= 2 && GENERIC_TAG_RE.test(t)) return true;
    return false;
  });
}

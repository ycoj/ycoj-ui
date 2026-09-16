import {
  addLineNumbers,
  parseCodeLanguage,
} from '@/shared/lib/code-line-numbers';
import { common, createStarryNight } from '@wooorm/starry-night';
import type { ElementContent } from 'hast';
import { toHtml } from 'hast-util-to-html';

const starryNight = await createStarryNight(common);

export type CodeHighlightFallback = 'cpp' | 'plaintext';

export function isSupportedCodeLanguage(language: string): boolean {
  return !!starryNight.flagToScope(parseCodeLanguage(language).language);
}

export function highlightCodeToHtml(
  code: string,
  language: string,
  fallback: CodeHighlightFallback = 'cpp'
) {
  const parsed = parseCodeLanguage(language);
  const scope =
    starryNight.flagToScope(parsed.language) ??
    (fallback === 'plaintext' ? undefined : starryNight.flagToScope('cpp'));

  const children = scope
    ? (starryNight.highlight(code, scope).children as ElementContent[])
    : ([{ type: 'text', value: code }] satisfies ElementContent[]);

  return toHtml({
    type: 'root',
    children: parsed.lineNumbers ? addLineNumbers(children) : children,
  });
}

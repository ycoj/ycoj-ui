import { common, createStarryNight } from '@wooorm/starry-night';
import { toHtml } from 'hast-util-to-html';

const starryNight = await createStarryNight(common);

export type CodeHighlightFallback = 'cpp' | 'plaintext';

export function isSupportedCodeLanguage(language: string): boolean {
  return !!starryNight.flagToScope(language);
}

export function highlightCodeToHtml(
  code: string,
  language: string,
  fallback: CodeHighlightFallback = 'cpp'
) {
  const scope =
    starryNight.flagToScope(language) ??
    (fallback === 'plaintext' ? undefined : starryNight.flagToScope('cpp'));

  if (!scope) {
    return toHtml({
      type: 'root',
      children: [{ type: 'text', value: code }],
    });
  }

  return toHtml(starryNight.highlight(code, scope));
}

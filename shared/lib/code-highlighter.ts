import { common, createStarryNight } from '@wooorm/starry-night';
import { toHtml } from 'hast-util-to-html';

const starryNight = await createStarryNight(common);

export function isSupportedCodeLanguage(language: string): boolean {
  return !!starryNight.flagToScope(language);
}

export function highlightCodeToHtml(code: string, language: string) {
  const scope =
    starryNight.flagToScope(language) ?? starryNight.flagToScope('cpp');
  return toHtml(starryNight.highlight(code, scope!));
}

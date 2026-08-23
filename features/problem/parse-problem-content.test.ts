import {
  parseProblemContent,
  serializeProblemContent,
} from './parse-problem-content';
import { describe, expect, it } from 'vitest';

describe('parseProblemContent', () => {
  it('returns empty array for blank content', () => {
    expect(parseProblemContent('')).toEqual([]);
    expect(parseProblemContent('   \n')).toEqual([]);
  });

  it('parses multi-language JSON and skips empty languages', () => {
    const content = JSON.stringify({
      zh: '中文题面',
      en: ' English statement ',
      jp: '  ',
      kr: '한국어',
    });

    expect(parseProblemContent(content)).toEqual([
      { language: 'zh', content: '中文题面' },
      { language: 'kr', content: '한국어' },
      { language: 'en', content: 'English statement' },
    ]);
  });

  it('falls back to zh plain text when JSON is invalid', () => {
    expect(parseProblemContent('not-json # title')).toEqual([
      { language: 'zh', content: 'not-json # title' },
    ]);
  });

  it('preserves only known language keys in fixed order', () => {
    const content = JSON.stringify({
      en: 'EN',
      zh_TW: '繁中',
      zh: '简中',
      fr: 'ignored',
    });

    expect(parseProblemContent(content)).toEqual([
      { language: 'zh', content: '简中' },
      { language: 'zh_TW', content: '繁中' },
      { language: 'en', content: 'EN' },
    ]);
  });
});

describe('serializeProblemContent', () => {
  it('returns an empty string when all languages are blank', () => {
    expect(serializeProblemContent({})).toBe('');
    expect(serializeProblemContent({ zh: '  ', en: '\n' })).toBe('');
  });

  it('keeps a single Chinese statement as plain text', () => {
    expect(serializeProblemContent({ zh: '# 题面' })).toBe('# 题面');
  });

  it('serializes a single non-Chinese statement as JSON', () => {
    expect(serializeProblemContent({ en: '# Statement' })).toBe(
      JSON.stringify({ en: '# Statement' })
    );
  });

  it('serializes multiple languages in fixed order with trimmed text', () => {
    expect(serializeProblemContent({ en: ' EN ', zh: '中文 ', kr: '  ' })).toBe(
      JSON.stringify({ zh: '中文', en: 'EN' })
    );
  });

  it('round-trips through parseProblemContent', () => {
    const serialized = serializeProblemContent({
      zh: '中文题面',
      zh_TW: '繁中題面',
      en: 'English statement',
    });
    expect(parseProblemContent(serialized)).toEqual([
      { language: 'zh', content: '中文题面' },
      { language: 'zh_TW', content: '繁中題面' },
      { language: 'en', content: 'English statement' },
    ]);
  });
});

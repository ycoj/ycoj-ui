import { pasteLanguageLabel } from '@/features/paste/paste-language';
import { describe, expect, it } from 'vitest';

const languageOptions = { cpp: 'C++', python: 'Python', javascript: 'JS' };

describe('pasteLanguageLabel', () => {
  it('uses the fallback for an empty language', () => {
    expect(pasteLanguageLabel('', languageOptions, 'Plain text')).toBe(
      'Plain text'
    );
  });

  it('uses the catalog name when present', () => {
    expect(pasteLanguageLabel('python', languageOptions, 'Plain text')).toBe(
      'Python'
    );
  });

  it.each(['rust', 'constructor'])(
    'returns unknown language %j as-is',
    (language) => {
      expect(pasteLanguageLabel(language, languageOptions, 'Plain text')).toBe(
        language
      );
    }
  );
});

import { pasteLanguageLabel } from './paste-language';
import { describe, expect, it } from 'vitest';

const names = { cpp: 'C++', python: 'Python', javascript: 'JS' };

describe('pasteLanguageLabel', () => {
  it('uses the fallback for an empty language', () => {
    expect(pasteLanguageLabel('', names, 'Plain text')).toBe('Plain text');
  });

  it('uses the catalog name when present', () => {
    expect(pasteLanguageLabel('python', names, 'Plain text')).toBe('Python');
  });

  it.each(['rust', 'constructor'])(
    'returns unknown language %j as-is',
    (language) => {
      expect(pasteLanguageLabel(language, names, 'Plain text')).toBe(language);
    }
  );
});

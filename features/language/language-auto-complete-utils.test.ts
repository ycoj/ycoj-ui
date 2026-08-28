import {
  filterLanguages,
  flattenLanguages,
  languageLabel,
  resolveLanguageOptions,
  type LanguageOption,
} from './language-auto-complete-utils';
import { describe, expect, it } from 'vitest';

const languages = {
  cc: {
    display: 'C++',
    versions: [
      { name: 'cc', display: 'C++' },
      { name: 'cc.cc17', display: 'C++17' },
    ],
  },
  python: {
    display: '',
    versions: [{ name: 'python.py3', display: 'Python 3' }],
  },
};

const options: LanguageOption[] = [
  {
    id: 'cc',
    family: 'cc',
    familyDisplay: 'C++',
    display: 'C++',
  },
  {
    id: 'cc.cc17',
    family: 'cc',
    familyDisplay: 'C++',
    display: 'C++17',
  },
  {
    id: 'python.py3',
    family: 'python',
    familyDisplay: 'python',
    display: 'Python 3',
  },
];

describe('language auto-complete utilities', () => {
  it('flattens language families and falls back to the family key', () => {
    expect(flattenLanguages(languages)).toEqual(options);
  });

  it('builds a family and version label', () => {
    expect(languageLabel(options[1])).toBe('C++ - C++17');
  });

  it('returns every option when the query is empty', () => {
    expect(filterLanguages(options, '  ')).toEqual(options);
  });

  it('filters by id, family, display name, and version', () => {
    expect(filterLanguages(options, 'CC17').map((option) => option.id)).toEqual(
      ['cc.cc17']
    );
    expect(
      filterLanguages(options, 'python').map((option) => option.id)
    ).toEqual(['python.py3']);
    expect(filterLanguages(options, 'C++').map((option) => option.id)).toEqual([
      'cc',
      'cc.cc17',
    ]);
  });

  it('resolves selected ids in order and marks unknown languages invalid', () => {
    expect(
      resolveLanguageOptions(options, ['python.py3', 'missing', 'cc.cc17'])
    ).toEqual([
      options[2],
      {
        id: 'missing',
        family: 'missing',
        familyDisplay: 'missing',
        display: 'missing',
        invalid: true,
      },
      options[1],
    ]);
  });
});

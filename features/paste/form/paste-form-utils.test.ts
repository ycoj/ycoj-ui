import { pasteDoc, pasteOptions } from '../paste.test-utils';
import {
  buildPastePayload,
  createPasteSchema,
  getPasteDefaults,
  getPasteLanguageOptions,
} from './paste-form-utils';
import { describe, expect, it } from 'vitest';

const schema = createPasteSchema({
  titleTooLong: 'title',
  contentRequired: 'required',
  contentTooLong: 'length',
  languageInvalid: 'language',
});

describe('paste form contract', () => {
  it('uses backend defaults for creation', () => {
    expect(
      getPasteDefaults({
        ...pasteOptions,
        defaultLanguage: 'javascript',
        defaultExpire: 'day',
      })
    ).toEqual({
      title: '',
      mode: 'code',
      content: '',
      language: 'javascript',
      expire: 'day',
    });
  });

  it('keeps edit values including an empty language', () => {
    expect(
      getPasteDefaults(pasteOptions, {
        ...pasteDoc,
        language: '',
        expire: 'never',
      })
    ).toEqual({
      title: pasteDoc.title,
      mode: 'code',
      content: pasteDoc.content,
      language: '',
      expire: 'never',
    });
  });

  it('preserves whitespace without treating whitespace-only content as empty', () => {
    for (const content of ['  code();\n\n', '  \n']) {
      const values = {
        ...getPasteDefaults(pasteOptions),
        title: '  title  ',
        content,
      };
      expect(schema.parse(values)).toEqual(values);
    }
  });

  it('matches title and content length boundaries', () => {
    const values = {
      ...getPasteDefaults(pasteOptions),
      title: 'a'.repeat(64),
      content: 'a'.repeat(65536),
    };
    expect(schema.safeParse(values).success).toBe(true);
    expect(schema.safeParse({ ...values, title: 'a'.repeat(65) }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ ...values, content: 'a'.repeat(65537) }).success
    ).toBe(false);
    expect(schema.safeParse({ ...values, content: '' }).success).toBe(false);
  });

  it.each(['', 'rust', 'custom-language', 'CPP', 'a'.repeat(64)])(
    'accepts backend language %j',
    (language) => {
      expect(
        schema.safeParse({
          ...getPasteDefaults(pasteOptions),
          content: 'x',
          language,
        }).success
      ).toBe(true);
    }
  );

  it.each(['c++', 'a b', '<script>', 'a'.repeat(65)])(
    'rejects invalid language %j',
    (language) => {
      expect(
        schema.safeParse({
          ...getPasteDefaults(pasteOptions),
          content: 'x',
          language,
        }).success
      ).toBe(false);
    }
  );

  it.each(['rust', '', 'constructor'])(
    'preserves saved option %j without mutating backend options',
    (language) => {
      expect(
        getPasteLanguageOptions(pasteOptions.languageNames, language)[language]
      ).toBe(language);
      expect(Object.hasOwn(pasteOptions.languageNames, language)).toBe(false);
    }
  );
});

describe('buildPastePayload', () => {
  it('keeps the selected language for code writes', () => {
    expect(
      buildPastePayload({
        title: '  title ',
        mode: 'code',
        language: 'rust',
        content: '  code();\n\n',
        expire: 'never',
      })
    ).toEqual({
      title: '  title ',
      mode: 'code',
      language: 'rust',
      content: '  code();\n\n',
      expire: 'never',
    });
  });

  it('clears language for markdown writes', () => {
    expect(
      buildPastePayload({
        title: '',
        mode: 'markdown',
        language: 'cpp',
        content: '# Heading',
        expire: 'day',
      })
    ).toEqual({
      title: '',
      mode: 'markdown',
      language: '',
      content: '# Heading',
      expire: 'day',
    });
  });
});

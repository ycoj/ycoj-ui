import Paste from './index';
import { describe, expect, it } from 'vitest';

describe('paste mutation contracts', () => {
  it('creates on the collection endpoint with exact content', () => {
    const method = Paste.createPaste(
      '  title ',
      'code',
      'rust',
      '  code();\n\n',
      'never'
    );
    expect(method.url).toBe('/paste');
    expect(method.data).toEqual({
      title: '  title ',
      mode: 'code',
      language: 'rust',
      content: '  code();\n\n',
      expire: 'never',
    });
  });

  it('dispatches update on the edit endpoint with the id and stored expiration choice', () => {
    const method = Paste.updatePaste('abc123', '', 'code', '', ' \n', 'week');
    expect(method.url).toBe('/paste/abc123/edit');
    expect(method.data).toEqual({
      operation: 'update',
      id: 'abc123',
      title: '',
      mode: 'code',
      language: '',
      content: ' \n',
      expire: 'week',
    });
  });

  it('clears language in both Markdown writes', () => {
    expect(
      Paste.createPaste('', 'markdown', 'cpp', '# Heading', 'day').data
    ).toMatchObject({ language: '' });
    expect(
      Paste.updatePaste(
        'abc123',
        '',
        'markdown',
        'python',
        '# Heading',
        'month'
      ).data
    ).toMatchObject({ language: '' });
  });

  it('deletes without submitting or validating form content', () => {
    const method = Paste.deletePaste('abc123');
    expect(method.url).toBe('/paste/abc123/edit');
    expect(method.data).toEqual({ operation: 'delete', id: 'abc123' });
  });
});

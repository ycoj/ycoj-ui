import Paste from './index';
import { describe, expect, it } from 'vitest';

describe('paste mutation contracts', () => {
  it('creates on the collection endpoint with the write payload', () => {
    const payload = {
      title: '  title ',
      mode: 'code' as const,
      language: 'rust',
      content: '  code();\n\n',
      expire: 'never' as const,
    };
    const method = Paste.createPaste(payload);
    expect(method.url).toBe('/paste');
    expect(method.data).toEqual(payload);
  });

  it('dispatches update on the edit endpoint with the id and payload', () => {
    const payload = {
      title: '',
      mode: 'code' as const,
      language: '',
      content: ' \n',
      expire: 'week' as const,
    };
    const method = Paste.updatePaste('abc123', payload);
    expect(method.url).toBe('/paste/abc123/edit');
    expect(method.data).toEqual({
      operation: 'update',
      id: 'abc123',
      ...payload,
    });
  });

  it('deletes without submitting or validating form content', () => {
    const method = Paste.deletePaste('abc123');
    expect(method.url).toBe('/paste/abc123/edit');
    expect(method.data).toEqual({ operation: 'delete', id: 'abc123' });
  });
});

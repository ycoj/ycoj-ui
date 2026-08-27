import { getConvertPrompt } from './html-to-markdown-prompt';
import { describe, expect, it } from 'vitest';

describe('getConvertPrompt', () => {
  it('returns html with unsaved false when the saved statement is HTML', () => {
    expect(getConvertPrompt('<p>saved</p>', '<p>saved</p>')).toEqual({
      kind: 'html',
      unsaved: false,
    });
  });

  it('returns html with unsaved true when current HTML differs from the saved copy', () => {
    expect(getConvertPrompt('<p>edited</p>', '<p>saved</p>')).toEqual({
      kind: 'html',
      unsaved: true,
    });
  });

  it('returns unsaved when markdown differs from the saved copy', () => {
    expect(getConvertPrompt('# edited', '# saved')).toEqual({
      kind: 'unsaved',
    });
  });

  it('returns none when markdown matches the saved copy', () => {
    expect(getConvertPrompt('# markdown', '# markdown')).toEqual({
      kind: 'none',
    });
  });
});

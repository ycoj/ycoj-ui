import {
  hasUnsavedStatementChange,
  shouldApplyHtmlToMarkdownResult,
  shouldPromptHtmlToMarkdown,
} from './html-to-markdown-guard';
import { describe, expect, it } from 'vitest';

describe('html-to-markdown-guard', () => {
  it('detects a changed statement against the saved copy', () => {
    expect(hasUnsavedStatementChange('<p>saved</p>', '<p>saved</p>')).toBe(
      false
    );
    expect(hasUnsavedStatementChange('<p>edited</p>', '<p>saved</p>')).toBe(
      true
    );
  });

  it('prompts when the current statement is HTML or differs from the saved copy', () => {
    expect(shouldPromptHtmlToMarkdown('# markdown', '# markdown')).toBe(false);
    expect(shouldPromptHtmlToMarkdown('<p>html</p>', '<p>html</p>')).toBe(true);
    expect(shouldPromptHtmlToMarkdown('# edited', '# saved')).toBe(true);
  });

  it('applies a conversion only when the statement is unchanged since the request started', () => {
    expect(shouldApplyHtmlToMarkdownResult('# same', '# same')).toBe(true);
    expect(shouldApplyHtmlToMarkdownResult('# later edit', '# start')).toBe(
      false
    );
  });
});

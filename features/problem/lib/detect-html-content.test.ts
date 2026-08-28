import { isHtmlContent } from './detect-html-content';
import { describe, expect, it } from 'vitest';

describe('isHtmlContent', () => {
  it('returns false for empty', () => {
    expect(isHtmlContent('')).toBe(false);
    expect(isHtmlContent('   ')).toBe(false);
  });

  it('returns false for plain markdown', () => {
    expect(isHtmlContent('# Title\n\nSome text with $x^2$ and $$y$$')).toBe(
      false
    );
    expect(isHtmlContent('```input1\n1 2\n```')).toBe(false);
  });

  it('detects simple html tags', () => {
    expect(isHtmlContent('<p>Hello world</p>')).toBe(true);
    expect(isHtmlContent('<div>hello</div>')).toBe(true);
    expect(isHtmlContent('<span>hi</span>')).toBe(true);
    expect(isHtmlContent('Hello<br>world')).toBe(true);
  });

  it('detects html with entities', () => {
    expect(isHtmlContent('&lt;div&gt;hello&lt;/div&gt; <p>hi</p>')).toBe(true);
  });

  it('detects multiple generic tags as html', () => {
    expect(isHtmlContent('<a href="#">link</a> <b>bold</b>')).toBe(true);
  });

  it('does not flag single generic angle bracket text', () => {
    expect(isHtmlContent('a < b and c > d')).toBe(false);
  });

  it('detects html inside JSON multi-lang content', () => {
    const json = JSON.stringify({ zh: '<p>hello</p>', en: 'Hello' });
    expect(isHtmlContent(json)).toBe(true);
  });

  it('returns false for JSON with only markdown', () => {
    const json = JSON.stringify({ zh: '# Title', en: 'Hello' });
    expect(isHtmlContent(json)).toBe(false);
  });

  it('detects table html', () => {
    expect(isHtmlContent('<table><tr><td>1</td></tr></table>')).toBe(true);
  });
});

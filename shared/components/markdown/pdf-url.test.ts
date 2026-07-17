import { getSafePdfUrl } from './pdf-url';
import { describe, expect, it } from 'vitest';

describe('getSafePdfUrl', () => {
  it.each([
    'https://example.com/document.pdf',
    'http://example.com/document.pdf',
    '//cdn.example.com/document.pdf',
    '/document.pdf',
    './document.pdf',
    '../document.pdf',
    'documents/document.pdf',
  ])('accepts the web PDF URL %s', (url) => {
    expect(getSafePdfUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'data:application/pdf;base64,AA==',
    'file:///document.pdf',
    'blob:https://example.com/id',
    '',
    '   ',
  ])('rejects the unsafe or empty PDF URL %s', (url) => {
    expect(getSafePdfUrl(url)).toBeNull();
  });

  it('rejects non-string values', () => {
    expect(getSafePdfUrl(undefined)).toBeNull();
    expect(getSafePdfUrl(123)).toBeNull();
  });
});

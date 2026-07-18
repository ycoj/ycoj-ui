import {
  defaultLocale,
  normalizeAcceptLanguage,
  normalizeLocale,
} from './config';
import { describe, expect, it } from 'vitest';

describe('locale configuration', () => {
  it('normalizes supported browser language tags', () => {
    expect(normalizeLocale('zh')).toBe('zh');
    expect(normalizeLocale('zh-CN')).toBe('zh');
    expect(normalizeLocale('zh-TW')).toBe('zh');
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('en-US')).toBe('en');
  });

  it('falls back to Chinese for unsupported or missing values', () => {
    expect(normalizeLocale('ja-JP')).toBe(defaultLocale);
    expect(normalizeLocale(undefined)).toBe(defaultLocale);
  });

  it('selects supported locales from weighted Accept-Language values', () => {
    expect(normalizeAcceptLanguage('en;q=0.9')).toBe('en');
    expect(normalizeAcceptLanguage('fr-CA, en;q=0.9')).toBe('en');
    expect(normalizeAcceptLanguage('zh;q=0.5, en-US;q=0.9')).toBe('en');
  });

  it('ignores unacceptable or invalid Accept-Language values', () => {
    expect(normalizeAcceptLanguage('en;q=0, zh;q=0.5')).toBe('zh');
    expect(normalizeAcceptLanguage('en;q=invalid')).toBe(defaultLocale);
    expect(normalizeAcceptLanguage(undefined)).toBe(defaultLocale);
  });
});

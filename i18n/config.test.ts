import { defaultLocale, normalizeLocale } from './config';
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
});

import en from './en';
import zh from './zh';
import { describe, expect, it } from 'vitest';

function getKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    getKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('translation catalogs', () => {
  it('contain the same message keys', () => {
    expect(getKeys(en).sort()).toEqual(getKeys(zh).sort());
  });
});

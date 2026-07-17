import { cn } from './utils';
import { describe, expect, it } from 'vitest';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'ok')).toBe(
      'base ok'
    );
  });
});

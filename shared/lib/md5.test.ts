// @vitest-environment node
import md5 from './md5';
import { describe, expect, it } from 'vitest';

describe('md5', () => {
  it('hashes the empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('hashes a known string', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});

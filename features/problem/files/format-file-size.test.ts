import { formatFileSize } from './format-file-size';
import { describe, expect, it } from 'vitest';

describe('formatFileSize', () => {
  it('formats bytes, kibibytes, and mebibytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1.0 KiB');
    expect(formatFileSize(1024 ** 2)).toBe('1.0 MiB');
  });

  it('returns a placeholder for invalid sizes', () => {
    expect(formatFileSize(-1)).toBe('-');
    expect(formatFileSize(Number.NaN)).toBe('-');
  });
});

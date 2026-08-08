import { isBinaryContent, isEditableFile } from './editable-file';
import { describe, expect, it } from 'vitest';

describe('isEditableFile', () => {
  it('allows text mime types', () => {
    for (const name of [
      'config.yaml',
      'std.cpp',
      'Main.java',
      'data.txt',
      'statement.md',
    ]) {
      expect(isEditableFile(name)).toBe(true);
    }
  });

  it('allows problem data extensions without a registered mime type', () => {
    for (const name of ['1.in', '1.out', '1.ans', 'case.IN']) {
      expect(isEditableFile(name)).toBe(true);
    }
  });

  it('rejects other unknown extensions and extensionless names', () => {
    for (const name of ['gen.py', '1.xyzabc', 'data.qwq', 'README']) {
      expect(isEditableFile(name)).toBe(false);
    }
  });

  it('rejects binary mime types case-insensitively', () => {
    for (const name of [
      'statement.pdf',
      'diagram.Png',
      'photo.JPEG',
      'data.zip',
      'video.mp4',
      'font.woff2',
    ]) {
      expect(isEditableFile(name)).toBe(false);
    }
  });
});

describe('isBinaryContent', () => {
  it('detects NUL bytes', () => {
    expect(isBinaryContent('PK\0\0binary')).toBe(true);
  });

  it('allows plain text', () => {
    expect(isBinaryContent('hello\nworld\n')).toBe(false);
  });
});

import { getPreviewableFileType } from './previewable-file';
import { describe, expect, it } from 'vitest';

describe('getPreviewableFileType', () => {
  it.each([
    ['document.pdf', 'pdf'],
    ['slides.PPTX', 'pptx'],
    ['photo.png', 'image'],
    ['diagram.SVG', 'image'],
  ])('recognizes %s as %s', (name, type) => {
    expect(getPreviewableFileType(name)).toBe(type);
  });

  it.each(['archive.zip', 'main.cpp', 'README', 'slides.ppt'])(
    'does not recognize %s',
    (name) => {
      expect(getPreviewableFileType(name)).toBeNull();
    }
  );
});

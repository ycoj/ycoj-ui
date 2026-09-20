export type PreviewableFileType = 'image' | 'pdf' | 'pptx';

const IMAGE_EXTENSIONS = new Set([
  'apng',
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'ico',
  'jfif',
  'jpeg',
  'jpg',
  'jxl',
  'png',
  'svg',
  'tif',
  'tiff',
  'webp',
]);

export function getPreviewableFileType(
  name: string
): PreviewableFileType | null {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  if (extension === 'pdf') return 'pdf';
  if (extension === 'pptx') return 'pptx';

  return IMAGE_EXTENSIONS.has(extension) ? 'image' : null;
}

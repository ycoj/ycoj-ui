import mime from 'mime-types';

// Problem data files use extensions without a registered mime type.
const EDITABLE_UNKNOWN_EXTENSIONS = new Set(['in', 'out', 'ans']);

export function isEditableFile(name: string): boolean {
  const type = mime.lookup(name);
  if (type) return type.startsWith('text/');
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return EDITABLE_UNKNOWN_EXTENSIONS.has(extension);
}

export function isBinaryContent(text: string): boolean {
  return text.includes('\0');
}

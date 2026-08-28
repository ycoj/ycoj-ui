import { isHtmlContent } from '@/features/problem/lib/detect-html-content';

export type ConvertPrompt =
  { kind: 'none' } | { kind: 'html'; unsaved: boolean } | { kind: 'unsaved' };

export function getConvertPrompt(
  content: string,
  originalContent: string
): ConvertPrompt {
  if (isHtmlContent(content)) {
    return { kind: 'html', unsaved: content !== originalContent };
  }
  if (content !== originalContent) {
    return { kind: 'unsaved' };
  }
  return { kind: 'none' };
}

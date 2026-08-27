import { isHtmlContent } from '@/features/problem/lib/detect-html-content';

export function hasUnsavedStatementChange(
  current: string,
  originalContent: string
): boolean {
  return current !== originalContent;
}

export function shouldPromptHtmlToMarkdown(
  content: string,
  originalContent: string
): boolean {
  return (
    isHtmlContent(content) ||
    hasUnsavedStatementChange(content, originalContent)
  );
}

export function shouldApplyHtmlToMarkdownResult(
  current: string,
  contentWhenStarted: string
): boolean {
  return current === contentWhenStarted;
}

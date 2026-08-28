import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type HtmlToMarkdownResponse = Errorable<{
  markdown: string;
}>;

export const htmlToMarkdown = (pid: string) =>
  clientRequest.Post<HtmlToMarkdownResponse>(`/p/${pid}`, {
    operation: 'html_to_markdown',
  });

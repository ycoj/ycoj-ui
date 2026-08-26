import { clientRequest } from '@/api/client';

export type HtmlToMarkdownResponse = {
  markdown: string;
};

export const htmlToMarkdown = (pid: string, profileId?: string) =>
  clientRequest.Post<HtmlToMarkdownResponse>(
    `/p/${pid}`,
    profileId
      ? { operation: 'html_to_markdown', profileId }
      : { operation: 'html_to_markdown' }
  );

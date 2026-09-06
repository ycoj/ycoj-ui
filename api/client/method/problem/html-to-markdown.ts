import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type HtmlToMarkdownSubmitResponse = Errorable<{
  jobId: string;
  status: 'pending';
}>;

export type HtmlToMarkdownPollResponse = Errorable<
  | { jobId: string; status: 'pending' | 'running' }
  | { jobId: string; status: 'completed'; markdown: string }
  | { jobId: string; status: 'failed'; error: string }
>;

export const submitHtmlToMarkdown = (pid: string, profileId?: string) =>
  clientRequest.Post<HtmlToMarkdownSubmitResponse>(`/p/${pid}`, {
    operation: 'html_to_markdown',
    ...(profileId && { profileId }),
  });

export const pollHtmlToMarkdown = (pid: string, jobId: string) =>
  clientRequest.Get<HtmlToMarkdownPollResponse>(
    `/p/${pid}/html-to-markdown/${jobId}`
  );

export const htmlToMarkdown = submitHtmlToMarkdown;

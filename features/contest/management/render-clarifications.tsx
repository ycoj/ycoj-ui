import type { ContestClarificationResponse } from '@/api/server/method/contests/management';
import Markdown from '@/shared/components/markdown';
import type { ReactNode } from 'react';

export type RenderedClarificationDoc = {
  content: ReactNode;
  replies: ReactNode[];
};

/** Pre-renders clarification markdown on the server, index-aligned with `tcdocs`. */
export function renderClarificationDocs(
  data: ContestClarificationResponse
): RenderedClarificationDoc[] {
  return data.tcdocs.map((doc) => ({
    content: <Markdown>{doc.content}</Markdown>,
    replies: (doc.reply ?? []).map((reply, replyIndex) => (
      <Markdown key={reply._id ?? replyIndex}>{reply.content}</Markdown>
    )),
  }));
}

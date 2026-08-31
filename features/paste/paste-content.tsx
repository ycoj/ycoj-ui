import PasteCode from '@/features/paste/paste-code';
import Markdown from '@/shared/components/markdown';
import type { PasteDoc } from '@/shared/types/paste';

type Props = { paste: Pick<PasteDoc, 'mode' | 'language' | 'content'> };

export default function PasteContent({ paste }: Props) {
  if (paste.mode === 'code') return <PasteCode paste={paste} />;

  return (
    <div
      className="min-w-0 overflow-x-auto rounded-xl border bg-card p-4"
      data-llm-visible="true"
      data-llm-text={paste.content}
    >
      <Markdown>{paste.content}</Markdown>
    </div>
  );
}

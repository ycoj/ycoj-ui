'use client';

import CodeCopyButton from '@/shared/components/code/code-copy-button';
import CodeRenderer from '@/shared/components/code/code-renderer';
import { confineSelectAllOnKeyDown } from '@/shared/lib/confine-select-all';
import type { PasteDoc } from '@/shared/types/paste';

type Props = { paste: Pick<PasteDoc, 'language' | 'content'> };

export default function PasteCode({ paste }: Props) {
  return (
    <div
      className="relative min-w-0 rounded-xl border bg-card p-4"
      data-llm-visible="true"
      data-llm-text={paste.content}
    >
      <CodeCopyButton text={paste.content} />
      <CodeRenderer
        code={paste.content}
        language={paste.language}
        fallback="plaintext"
        className="overflow-x-auto text-sm whitespace-pre outline-none"
        tabIndex={0}
        onKeyDown={confineSelectAllOnKeyDown}
      />
    </div>
  );
}

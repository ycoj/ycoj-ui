import CodeRenderer from '@/shared/components/code/code-renderer';
import Markdown from '@/shared/components/markdown';
import { isSupportedCodeLanguage } from '@/shared/lib/code-highlighter';
import type { PasteDoc } from '@/shared/types/paste';

type Props = { paste: Pick<PasteDoc, 'mode' | 'language' | 'content'> };

export default function PasteContent({ paste }: Props) {
  return (
    <div
      className="min-w-0 overflow-x-auto rounded-xl border bg-card p-4"
      data-llm-visible="true"
      data-llm-text={paste.content}
    >
      {paste.mode === 'markdown' ? (
        <Markdown>{paste.content}</Markdown>
      ) : isSupportedCodeLanguage(paste.language) ? (
        <CodeRenderer
          code={paste.content}
          language={paste.language}
          className="overflow-x-auto text-sm whitespace-pre"
          tabIndex={0}
        />
      ) : (
        <pre className="overflow-x-auto text-sm whitespace-pre" tabIndex={0}>
          <code>{paste.content}</code>
        </pre>
      )}
    </div>
  );
}

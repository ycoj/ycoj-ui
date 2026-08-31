import '@/shared/components/code/style/both.css';
import {
  highlightCodeToHtml,
  type CodeHighlightFallback,
} from '@/shared/lib/code-highlighter';
import type { HTMLAttributes } from 'react';

type Props = {
  code: string;
  language: string;
  fallback?: CodeHighlightFallback;
} & Pick<
  HTMLAttributes<HTMLPreElement>,
  'tabIndex' | 'onKeyDown' | 'className'
>;

export default function CodeRenderer({
  code,
  language,
  fallback = 'cpp',
  className,
  tabIndex,
  onKeyDown,
}: Props) {
  const html = highlightCodeToHtml(code, language, fallback);
  return (
    <pre
      tabIndex={tabIndex}
      className={className}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

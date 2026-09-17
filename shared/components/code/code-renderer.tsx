import '@/shared/components/code/style/both.css';
import '@/shared/components/code/style/line-numbers.css';
import {
  highlightCodeToHtml,
  type CodeHighlightFallback,
} from '@/shared/lib/code-highlighter';
import { LINE_NUMBER_DIGITS_VARIABLE } from '@/shared/lib/code-line-numbers';
import type { CSSProperties, HTMLAttributes } from 'react';

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
  const { html, lineNumberDigits } = highlightCodeToHtml(
    code,
    language,
    fallback
  );
  const style =
    lineNumberDigits === undefined
      ? undefined
      : ({ [LINE_NUMBER_DIGITS_VARIABLE]: lineNumberDigits } as CSSProperties);

  return (
    <pre
      tabIndex={tabIndex}
      className={className}
      style={style}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

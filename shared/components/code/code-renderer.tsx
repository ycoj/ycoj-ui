import '@/shared/components/code/style/both.css';
import { highlightCodeToHtml } from '@/shared/lib/code-highlighter';
import type { HTMLAttributes } from 'react';

type Props = {
  code: string;
  language: string;
} & Pick<
  HTMLAttributes<HTMLPreElement>,
  'tabIndex' | 'onKeyDown' | 'className'
>;

/**
 * Renders highlighted source with dangerouslySetInnerHTML. Only pass trusted code.
 *
 * @param code Source to render
 * @param language Language id, mapped to a starry-night scope
 */
export default function CodeRenderer({
  code,
  language,
  className,
  tabIndex,
  onKeyDown,
}: Props) {
  const html = highlightCodeToHtml(code, language);
  return (
    <pre
      tabIndex={tabIndex}
      className={className}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

'use client';

import '@/shared/components/code/style/both.css';
import { highlightCodeToHtml } from '@/shared/lib/code-highlighter';
import {
  isSelectAllHotkey,
  selectElementContents,
} from '@/shared/lib/confine-select-all';
import type { KeyboardEvent } from 'react';

type Props = {
  code: string;
  language: string;
};

function handleCodeKeyDown(event: KeyboardEvent<HTMLPreElement>) {
  if (!isSelectAllHotkey(event)) return;
  event.preventDefault();
  selectElementContents(event.currentTarget);
}

/**
 * Renders highlighted source with dangerouslySetInnerHTML. Only pass trusted code.
 *
 * @param code Source to render
 * @param language Language id, mapped to a starry-night scope
 */
export default function CodeRenderer({ code, language }: Props) {
  const html = highlightCodeToHtml(code, language);
  return (
    <pre
      tabIndex={0}
      className="outline-none"
      onKeyDown={handleCodeKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

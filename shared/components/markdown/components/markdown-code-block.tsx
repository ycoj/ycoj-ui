'use client';

import CodeCopyButton from '@/shared/components/code/code-copy-button';
import { confineSelectAllOnKeyDown } from '@/shared/lib/confine-select-all';
import { cn } from '@/shared/lib/utils';
import { type HTMLAttributes, useRef } from 'react';
import type { ExtraProps } from 'react-markdown';

type Props = HTMLAttributes<HTMLPreElement> & ExtraProps;

export default function MarkdownCodeBlock({
  children,
  className,
  node,
  ...props
}: Props) {
  void node;
  const preRef = useRef<HTMLPreElement>(null);

  return (
    <div className="relative">
      <CodeCopyButton
        text={() => preRef.current?.textContent ?? ''}
        variant="inline"
      />
      <pre
        {...props}
        ref={preRef}
        tabIndex={0}
        className={cn('outline-none', className)}
        onKeyDown={confineSelectAllOnKeyDown}
      >
        {children}
      </pre>
    </div>
  );
}

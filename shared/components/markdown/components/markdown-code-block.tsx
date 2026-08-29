'use client';

import CodeCopyButton from '@/shared/components/code/code-copy-button';
import {
  isSelectAllHotkey,
  selectElementContents,
} from '@/shared/lib/confine-select-all';
import { cn } from '@/shared/lib/utils';
import {
  isValidElement,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useMemo,
} from 'react';

type Props = HTMLAttributes<HTMLPreElement> & {
  node?: unknown;
};

export function getReactNodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getReactNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getReactNodeText(node.props.children);
  }
  return '';
}

function handleCodeKeyDown(event: KeyboardEvent<HTMLPreElement>) {
  if (!isSelectAllHotkey(event)) return;
  event.preventDefault();
  selectElementContents(event.currentTarget);
}

export default function MarkdownCodeBlock({
  children,
  className,
  ...props
}: Props) {
  const text = useMemo(() => getReactNodeText(children), [children]);
  Reflect.deleteProperty(props, 'node');

  return (
    <div className="relative">
      <CodeCopyButton text={text} variant="inline" />
      <pre
        {...props}
        tabIndex={0}
        className={cn('outline-none', className)}
        onKeyDown={handleCodeKeyDown}
      >
        {children}
      </pre>
    </div>
  );
}

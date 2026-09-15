import { cn } from '@/shared/lib/utils';
import type { ReactNode } from 'react';

const ALIGN_CLASSNAMES = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
} as const;
type AlignValue = keyof typeof ALIGN_CLASSNAMES;

type Props = {
  node?: unknown;
  className?: string;
  children?: ReactNode;
};

function getPropValue(
  props: Record<string, unknown>,
  kebabName: string,
  camelName: string
): unknown {
  return props[kebabName] ?? props[camelName];
}

function isAlignValue(value: unknown): value is AlignValue {
  return typeof value === 'string' && Object.hasOwn(ALIGN_CLASSNAMES, value);
}

export default function MarkdownAlign({
  className,
  children,
  ...props
}: Props) {
  const raw = getPropValue(
    props as Record<string, unknown>,
    'data-align',
    'dataAlign'
  );
  const align = isAlignValue(raw) ? raw : 'center';

  return (
    <div className={cn(ALIGN_CLASSNAMES[align], className)}>{children}</div>
  );
}

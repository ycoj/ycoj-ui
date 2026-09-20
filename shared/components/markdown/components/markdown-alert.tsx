'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { cn } from '@/shared/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

const ALERT_VARIANTS = ['error', 'info', 'success', 'warning'] as const;
type AlertVariant = (typeof ALERT_VARIANTS)[number];

const VARIANT_STYLES: Record<
  AlertVariant,
  { className: string; icon: LucideIcon }
> = {
  info: {
    icon: Info,
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
  },
  warning: {
    icon: TriangleAlert,
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-950/40 dark:text-yellow-300',
  },
  success: {
    icon: CircleCheck,
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300',
  },
  error: {
    icon: CircleX,
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  },
};

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

function isAlertVariant(value: unknown): value is AlertVariant {
  return (
    typeof value === 'string' &&
    (ALERT_VARIANTS as readonly string[]).includes(value)
  );
}

export default function MarkdownAlert({
  className,
  children,
  ...props
}: Props) {
  const propsMap = props as Record<string, unknown>;
  const variantRaw = getPropValue(propsMap, 'data-variant', 'dataVariant');
  const variant = isAlertVariant(variantRaw) ? variantRaw : 'info';
  const titleRaw = getPropValue(propsMap, 'data-title', 'dataTitle');
  const title =
    typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim() : null;
  // Titled containers collapse to their title by default; an explicit
  // {opened}/{closed} marker in the directive overrides the default.
  const stateRaw = getPropValue(propsMap, 'data-state', 'dataState');
  const [open, setOpen] = useState(stateRaw === 'opened');
  const style = VARIANT_STYLES[variant];
  const Icon = style.icon;

  return (
    <Alert
      data-llm-visible="true"
      className={cn('not-prose my-4', style.className, className)}
    >
      <Icon strokeWidth={2} className="text-current" />
      {title && (
        <AlertTitle data-llm-text={title}>
          <button
            type="button"
            aria-expanded={open}
            className="flex w-full cursor-pointer items-center gap-1"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex-1 text-left">{title}</span>
            <ChevronRight
              strokeWidth={2}
              className={cn(
                'size-4 shrink-0 transition-transform',
                open && 'rotate-90'
              )}
            />
          </button>
        </AlertTitle>
      )}
      {(!title || open) && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  );
}

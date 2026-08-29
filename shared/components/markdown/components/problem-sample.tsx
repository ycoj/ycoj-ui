'use client';

import { Button } from '@/shared/components/ui/button';
import { useClipboardCopy } from '@/shared/hooks/use-clipboard-copy';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  node?: unknown;
};

export type ProblemSampleAction = {
  label: string;
  onSelect: (input: string) => void;
};

const ProblemSampleActionContext = createContext<ProblemSampleAction | null>(
  null
);

export function ProblemSampleActionProvider({
  action,
  children,
}: {
  action: ProblemSampleAction;
  children: ReactNode;
}) {
  return (
    <ProblemSampleActionContext.Provider value={action}>
      {children}
    </ProblemSampleActionContext.Provider>
  );
}

function decodePayload(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getPropValue(
  props: Record<string, unknown>,
  kebabName: string,
  camelName: string
): unknown {
  return props[kebabName] ?? props[camelName];
}

function SamplePane({
  label,
  text,
  actionLabel,
  onAction,
}: {
  label: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = useTranslations('problem.sample');
  const { copied, onCopy } = useClipboardCopy(text);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="my-0.5!">{label}</h3>
        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <Button
              variant="secondary"
              type="button"
              onClick={onAction}
              size="sm"
              data-llm-text={actionLabel}
            >
              {actionLabel}
            </Button>
          )}
          <Button variant="secondary" type="button" onClick={onCopy} size="sm">
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
      </div>
      <pre className="my-1!">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function ProblemSample({ className, ...props }: Props) {
  const t = useTranslations('problem.sample');
  const sampleAction = useContext(ProblemSampleActionContext);
  const propsMap = props as Record<string, unknown>;

  const index = useMemo(() => {
    const raw = getPropValue(propsMap, 'data-index', 'dataIndex');
    return typeof raw === 'string' && raw ? raw : '';
  }, [propsMap]);

  const input = useMemo(() => {
    const raw = getPropValue(propsMap, 'data-input', 'dataInput');
    return decodePayload(raw);
  }, [propsMap]);

  const output = useMemo(() => {
    const raw = getPropValue(propsMap, 'data-output', 'dataOutput');
    return decodePayload(raw);
  }, [propsMap]);

  if (!input && !output) return null;

  return (
    <div className={cn('my-6 space-y-3', className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SamplePane
          label={t('input', { index: index || '' })}
          text={input}
          actionLabel={sampleAction?.label}
          onAction={
            sampleAction ? () => sampleAction.onSelect(input) : undefined
          }
        />
        <SamplePane label={t('output', { index: index || '' })} text={output} />
      </div>
    </div>
  );
}

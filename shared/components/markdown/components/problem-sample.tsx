'use client';

import { Button } from '@/shared/components/ui/button';
import { useClipboardCopy } from '@/shared/hooks/use-clipboard-copy';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { HTMLAttributes } from 'react';
import { createContext, useContext, useMemo } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  node?: unknown;
};

const ProblemSamplePretestContext = createContext<
  ((input: string) => void) | null
>(null);

export function ProblemSamplePretestProvider({
  children,
  onFill,
}: {
  children: React.ReactNode;
  onFill: (input: string) => void;
}) {
  return (
    <ProblemSamplePretestContext.Provider value={onFill}>
      {children}
    </ProblemSamplePretestContext.Provider>
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
  onFillPretest,
}: {
  label: string;
  text: string;
  onFillPretest?: () => void;
}) {
  const t = useTranslations('problem.sample');
  const { copied, onCopy } = useClipboardCopy(text);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="my-0.5!">{label}</h3>
        <div className="flex items-center gap-2">
          {onFillPretest && (
            <Button
              variant="secondary"
              type="button"
              onClick={onFillPretest}
              size="sm"
              data-llm-text={t('fillPretest')}
            >
              {t('fillPretest')}
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
  const fillPretest = useContext(ProblemSamplePretestContext);
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
          onFillPretest={fillPretest ? () => fillPretest(input) : undefined}
        />
        <SamplePane label={t('output', { index: index || '' })} text={output} />
      </div>
    </div>
  );
}

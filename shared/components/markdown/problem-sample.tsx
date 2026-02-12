'use client';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { HTMLAttributes } from 'react';
import { useCallback, useMemo, useState } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  node?: unknown;
};

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

function SamplePane({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [text]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="my-0.5!">{label}</h3>
        <Button variant="secondary" type="button" onClick={onCopy} size="sm">
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <pre className="my-1!">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export default function ProblemSample({ className, ...props }: Props) {
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
        <SamplePane label={`样例 ${index || ''} 输入`} text={input} />
        <SamplePane label={`样例 ${index || ''} 输出`} text={output} />
      </div>
    </div>
  );
}

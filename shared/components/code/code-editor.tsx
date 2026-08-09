'use client';

import { cn } from '@/shared/lib/utils';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

type Props = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  tabSize?: number;
  className?: string;
};

export default function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  height = '480px',
  readOnly = false,
  invalid = false,
  ariaLabel,
  tabSize = 2,
  className,
}: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      style={{ height }}
      className={cn(
        'overflow-hidden rounded-lg border bg-transparent',
        readOnly && 'cursor-not-allowed opacity-50',
        invalid && 'border-destructive',
        className
      )}
    >
      <Editor
        height="100%"
        language={language}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        value={value}
        onChange={(next) => onChange?.(next ?? '')}
        loading={
          <div className="h-full w-full bg-muted/30" aria-hidden="true" />
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: 'on',
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          tabSize,
          ariaLabel,
        }}
      />
    </div>
  );
}

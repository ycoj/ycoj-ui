'use client';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  text: string;
  className?: string;
  variant?: 'corner' | 'inline';
};

export default function CodeCopyButton({
  text,
  className,
  variant = 'corner',
}: Props) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<number | null>(null);

  const label = copied ? t('copied') : t('copy');

  useEffect(() => {
    return () => {
      if (copiedResetTimeoutRef.current !== null) {
        window.clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  const onCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copiedResetTimeoutRef.current !== null) {
        window.clearTimeout(copiedResetTimeoutRef.current);
      }
      copiedResetTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedResetTimeoutRef.current = null;
      }, 1200);
    } catch {
      setCopied(false);
    }
  }, [text]);

  switch (variant) {
    case 'inline':
      return (
        <Button
          variant="ghost"
          type="button"
          className={cn(
            'not-prose absolute top-2 right-2 z-10 h-auto cursor-pointer gap-1.5 rounded-md border-0 bg-black/4 px-3 py-1.5 leading-none shadow-none hover:bg-black/8 dark:bg-black/20 dark:hover:bg-black/30',
            className
          )}
          onClick={() => void onCopy()}
        >
          {copied ? <Check /> : <Copy />}
          <span className="inline-flex h-3.5 items-center leading-none">
            {label}
          </span>
        </Button>
      );
    case 'corner':
      return (
        <Button
          variant="ghost"
          type="button"
          className={cn(
            'not-prose bg-card border-border absolute top-0 right-0 z-10 h-auto cursor-pointer gap-1.5 rounded-none rounded-tr-xl rounded-bl-md border-t-0 border-r-0 border-b border-l px-3 py-1.5 leading-none',
            className
          )}
          onClick={() => void onCopy()}
        >
          {copied ? <Check /> : <Copy />}
          <span className="inline-flex h-3.5 items-center leading-none">
            {label}
          </span>
        </Button>
      );
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

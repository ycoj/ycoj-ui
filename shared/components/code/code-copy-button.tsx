'use client';

import { Button } from '@/shared/components/ui/button';
import { useClipboardCopy } from '@/shared/hooks/use-clipboard-copy';
import { cn } from '@/shared/lib/utils';
import { cva } from 'class-variance-authority';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

const codeCopyButtonVariants = cva(
  'not-prose absolute z-10 h-auto cursor-pointer gap-1.5 px-3 py-1.5 leading-none',
  {
    variants: {
      variant: {
        inline:
          'top-2 right-2 rounded-md border-0 bg-black/4 shadow-none hover:bg-black/8 dark:bg-black/20 dark:hover:bg-black/30',
        corner:
          'bg-card border-border top-0 right-0 rounded-none rounded-tr-xl rounded-bl-md border-t-0 border-r-0 border-b border-l',
      },
    },
    defaultVariants: {
      variant: 'corner',
    },
  }
);

type Props = {
  text: string | (() => string);
  className?: string;
  variant?: 'corner' | 'inline';
};

export default function CodeCopyButton({
  text,
  className,
  variant = 'corner',
}: Props) {
  const t = useTranslations('common');
  const { copied, onCopy } = useClipboardCopy(text);
  const label = copied ? t('copied') : t('copy');

  return (
    <Button
      variant="ghost"
      type="button"
      className={cn(codeCopyButtonVariants({ variant }), className)}
      onClick={() => void onCopy()}
    >
      {copied ? <Check /> : <Copy />}
      <span className="inline-flex h-3.5 items-center leading-none">
        {label}
      </span>
    </Button>
  );
}

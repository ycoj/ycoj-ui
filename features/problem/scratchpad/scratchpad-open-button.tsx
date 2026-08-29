'use client';

import { useScratchpad } from '@/features/problem/scratchpad/scratchpad-provider';
import { Button } from '@/shared/components/ui/button';
import { Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ScratchpadOpenButton() {
  const t = useTranslations('problem.scratchpad');
  const { open } = useScratchpad();

  return (
    <Button
      type="button"
      className="h-10 w-full justify-start gap-3 px-4"
      onClick={open}
    >
      <Maximize2 strokeWidth={2} />
      <span data-llm-text={t('open')}>{t('open')}</span>
      <kbd className="ml-auto text-xs opacity-70">Alt+E</kbd>
    </Button>
  );
}

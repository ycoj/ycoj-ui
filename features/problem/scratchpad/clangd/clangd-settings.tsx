'use client';

import { getClangdSupport } from './clangd-support';
import { Button } from '@/shared/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  reloading: boolean;
  onReload: () => Promise<void>;
};

export default function ClangdSettings({
  enabled,
  onChange,
  reloading,
  onReload,
}: Props) {
  const t = useTranslations('problem.scratchpad.clangd');
  const [support] = useState(getClangdSupport);
  const blocked = support === 'unsupported' || support === 'lowMemory';
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('title')}</p>
      <p id="clangd-description" className="text-sm text-muted-foreground">
        {t('description')}
      </p>
      <p className="text-sm text-muted-foreground">{t('compatibility')}</p>
      {blocked && (
        <p role="status" className="text-sm text-muted-foreground">
          {t(support)}
        </p>
      )}
      {support === 'reload' && (
        <p className="text-sm text-muted-foreground">
          {t('reloadDescription')}
        </p>
      )}
      {support === 'reload' && (
        <Button size="sm" disabled={reloading} onClick={() => void onReload()}>
          {t(reloading ? 'saving' : 'enableReload')}
        </Button>
      )}
      {(support !== 'reload' || enabled) && (
        <Button
          size="sm"
          variant={enabled ? 'secondary' : 'outline'}
          aria-pressed={enabled}
          aria-describedby="clangd-description"
          disabled={reloading || (!enabled && blocked)}
          onClick={() => onChange(!enabled)}
        >
          {t(enabled ? 'disable' : 'enable')}
        </Button>
      )}
    </div>
  );
}

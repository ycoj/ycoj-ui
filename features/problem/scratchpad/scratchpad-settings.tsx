'use client';

import type {
  ScratchpadEditorTheme,
  ScratchpadSettings,
} from '@/features/problem/scratchpad/scratchpad-types';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  settings: ScratchpadSettings;
  onChange: (settings: ScratchpadSettings) => void;
};

export default function ScratchpadSettingsPanel({ settings, onChange }: Props) {
  const t = useTranslations('problem.scratchpad');
  const [fontSizeDraft, setFontSizeDraft] = useState<string>(
    String(settings.fontSize)
  );

  return (
    <div className="space-y-6 p-4" data-llm-visible="true">
      <div className="space-y-2">
        <Label htmlFor="scratchpad-font-size" data-llm-text={t('fontSize')}>
          {t('fontSize')}
        </Label>
        <Input
          id="scratchpad-font-size"
          type="number"
          min={10}
          max={32}
          value={fontSizeDraft}
          onChange={(event) => setFontSizeDraft(event.target.value)}
          onBlur={() => {
            const parsed = Number(fontSizeDraft);
            const clamped = Math.min(32, Math.max(10, parsed || 14));
            setFontSizeDraft(String(clamped));
            onChange({ ...settings, fontSize: clamped });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scratchpad-tab-size" data-llm-text={t('tabSize')}>
          {t('tabSize')}
        </Label>
        <Input
          id="scratchpad-tab-size"
          type="number"
          min={1}
          max={8}
          value={settings.tabSize}
          onChange={(event) =>
            onChange({
              ...settings,
              tabSize: Math.min(
                8,
                Math.max(1, Number(event.target.value) || 2)
              ),
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scratchpad-theme" data-llm-text={t('theme')}>
          {t('theme')}
        </Label>
        <Select
          value={settings.theme}
          onValueChange={(theme: ScratchpadEditorTheme) =>
            onChange({ ...settings, theme })
          }
        >
          <SelectTrigger id="scratchpad-theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{t('themeSystem')}</SelectItem>
            <SelectItem value="light">{t('themeLight')}</SelectItem>
            <SelectItem value="dark">{t('themeDark')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

'use client';

import UserImportDialog from './user-import-dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

export type PasswordFill =
  | { mode: 'fixed'; password: string; emptyOnly: boolean }
  | { mode: 'random'; length: number; symbols: boolean; emptyOnly: boolean };

type Props = {
  open: boolean;
  missingPasswords: number;
  onOpenChange: (open: boolean) => void;
  onApply: (fill: PasswordFill) => boolean;
};

export default function PasswordsDialog({
  open,
  missingPasswords,
  onOpenChange,
  onApply,
}: Props) {
  const t = useTranslations('userImport.passwords');
  const uid = useId();
  const [mode, setMode] = useState<'fixed' | 'random'>('random');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState('10');
  const [symbols, setSymbols] = useState(true);
  // The dialog stays mounted between opens, so the checkbox falls back to a
  // per-open default until the user toggles it explicitly.
  const [emptyOnlyChoice, setEmptyOnlyChoice] = useState<boolean | null>(null);
  const emptyOnly = emptyOnlyChoice ?? missingPasswords > 0;
  const [error, setError] = useState('');

  const apply = () => {
    if (mode === 'fixed') {
      // The server requires 6–255 characters and trims the stored value.
      const size = password.trim().length;
      if (size < 6 || size > 255) {
        setError(t('passwordInvalid'));
        return false;
      }
      setError('');
      return onApply({ mode, password, emptyOnly });
    }
    const size = Math.floor(Number(length) || 0);
    if (size < 6 || size > 64) {
      setError(t('lengthInvalid'));
      return false;
    }
    setError('');
    return onApply({ mode, length: size, symbols, emptyOnly });
  };

  return (
    <UserImportDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      applyLabel={t('apply')}
      error={error}
      onApply={apply}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('mode')}</legend>
        {(
          [
            ['random', t('modeRandom')],
            ['fixed', t('modeFixed')],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="hover:bg-accent/50 has-[input:checked]:border-primary has-[input:checked]:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
          >
            <input
              type="radio"
              name={`${uid}-mode`}
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="accent-primary size-4 shrink-0"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </fieldset>
      {mode === 'fixed' ? (
        <div className="space-y-2">
          <Label htmlFor={`${uid}-password`}>{t('password')}</Label>
          <Input
            id={`${uid}-password`}
            value={password}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-28 space-y-2">
            <Label htmlFor={`${uid}-length`}>{t('length')}</Label>
            <Input
              id={`${uid}-length`}
              type="number"
              min={6}
              max={64}
              value={length}
              onChange={(event) => setLength(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id={`${uid}-symbols`}
              checked={symbols}
              onCheckedChange={(checked) => setSymbols(!!checked)}
            />
            <Label htmlFor={`${uid}-symbols`}>{t('symbols')}</Label>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${uid}-empty-only`}
          checked={emptyOnly}
          onCheckedChange={(checked) => setEmptyOnlyChoice(!!checked)}
        />
        <Label htmlFor={`${uid}-empty-only`}>
          {t('emptyOnly', { count: missingPasswords })}
        </Label>
      </div>
    </UserImportDialog>
  );
}

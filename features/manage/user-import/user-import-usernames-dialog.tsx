'use client';

import UserImportDialog from './user-import-dialog';
import type { UsernamePattern } from './user-import-rows';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

export type UsernameTarget = 'append' | 'fill';

type Props = {
  missingUsernames: number;
  onOpenChange: (open: boolean) => void;
  onApply: (pattern: UsernamePattern, target: UsernameTarget) => void;
};

export default function UsernamesDialog({
  missingUsernames,
  onOpenChange,
  onApply,
}: Props) {
  const t = useTranslations('userImport.usernames');
  const uid = useId();
  const [target, setTarget] = useState<UsernameTarget>(
    missingUsernames > 0 ? 'fill' : 'append'
  );
  const [prefix, setPrefix] = useState('');
  const [start, setStart] = useState('1');
  const [digits, setDigits] = useState('3');
  const [count, setCount] = useState('30');
  const [error, setError] = useState('');

  const apply = () => {
    const trimmed = prefix.trim();
    if (!trimmed) {
      setError(t('prefixRequired'));
      return;
    }
    const startNumber = Math.max(0, Math.floor(Number(start) || 0));
    const pad = Math.min(10, Math.max(0, Math.floor(Number(digits) || 0)));
    const amount =
      target === 'fill' ? missingUsernames : Math.floor(Number(count) || 0);
    if (amount < 1 || amount > 1000) {
      setError(t('countInvalid'));
      return;
    }
    onApply(
      { prefix: trimmed, start: startNumber, count: amount, digits: pad },
      target
    );
    onOpenChange(false);
  };

  return (
    <UserImportDialog
      open
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      applyLabel={t('apply')}
      applyDisabled={target === 'fill' && missingUsernames === 0}
      error={error}
      onApply={apply}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('target')}</legend>
        {(
          [
            ['append', t('targetAppend')],
            ['fill', t('targetFill')],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="hover:bg-accent/50 has-[input:checked]:border-primary has-[input:checked]:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
          >
            <input
              type="radio"
              name={`${uid}-target`}
              value={value}
              checked={target === value}
              onChange={() => setTarget(value)}
              className="accent-primary size-4 shrink-0"
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
        {target === 'fill' && (
          <p className="text-muted-foreground text-sm">
            {t('fillCount', { count: missingUsernames })}
          </p>
        )}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${uid}-prefix`}>{t('prefix')}</Label>
          <Input
            id={`${uid}-prefix`}
            value={prefix}
            placeholder={t('prefixPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setPrefix(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-start`}>{t('start')}</Label>
          <Input
            id={`${uid}-start`}
            type="number"
            min={0}
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-digits`}>{t('digits')}</Label>
          <Input
            id={`${uid}-digits`}
            type="number"
            min={0}
            max={10}
            value={digits}
            onChange={(event) => setDigits(event.target.value)}
          />
        </div>
        {target === 'append' && (
          <div className="space-y-2">
            <Label htmlFor={`${uid}-count`}>{t('count')}</Label>
            <Input
              id={`${uid}-count`}
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm">
        {t('example', {
          username: `${prefix.trim() || t('prefixExample')}${String(
            Math.max(0, Math.floor(Number(start) || 0))
          ).padStart(
            Math.min(10, Math.max(0, Math.floor(Number(digits) || 0))),
            '0'
          )}`,
        })}
      </p>
    </UserImportDialog>
  );
}

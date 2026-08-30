'use client';

import { isExpirationDate } from './expiration-utils';
import { submitExpiration } from './submit-expiration';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  navigateToSudo,
  SudoRedirectError,
} from '@/shared/lib/sudo-navigation';
import type { AccountExpirationAction } from '@/shared/types/account-expiration';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, Minus, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type ExpirationDialogTarget = {
  operation: AccountExpirationAction['operation'];
  uids: number[];
  expireDate?: string;
};
type Props = {
  target: ExpirationDialogTarget;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ExpirationActionDialog({
  target,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('accountExpiration');
  const busy = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{ value: string }>({
    resolver: zodResolver(
      z.object({
        value:
          target.operation === 'set'
            ? z.string().refine(isExpirationDate, t('invalidDate'))
            : target.operation === 'adjust'
              ? z
                  .string()
                  .refine(
                    (value) =>
                      Number.isSafeInteger(Number(value)) &&
                      Number(value) !== 0,
                    t('invalidDays')
                  )
              : z.string(),
      })
    ),
    defaultValues: { value: target.expireDate ?? '' },
  });
  const run = async (action: AccountExpirationAction) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await submitExpiration(action, t('failed'));
      if (result === 'sudo') navigateToSudo();
      else onSuccess();
    } catch (error) {
      if (error instanceof SudoRedirectError) return;
      setError('root', {
        message:
          error instanceof Error && error.message ? error.message : t('failed'),
      });
    } finally {
      busy.current = false;
    }
  };
  const submit = ({ value }: { value: string }) =>
    run(
      target.operation === 'set'
        ? { operation: 'set', uids: target.uids, expireDate: value }
        : target.operation === 'adjust'
          ? { operation: 'adjust', uids: target.uids, days: Number(value) }
          : { operation: 'clear', uids: target.uids }
    );

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="text-lg font-semibold"
            data-llm-text={t(`operation.${target.operation}`)}
          >
            {t(`operation.${target.operation}`)}
          </Dialog.Title>
          <Dialog.Description className="mt-2 mb-4 text-sm text-muted-foreground">
            {t('targets', { count: target.uids.length })}
          </Dialog.Description>
          <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            {target.operation !== 'clear' ? (
              <div className="space-y-2">
                <Label htmlFor="expiration-value">
                  {t(target.operation === 'set' ? 'date' : 'days')}
                </Label>
                <Input
                  id="expiration-value"
                  type={target.operation === 'set' ? 'date' : 'number'}
                  step={target.operation === 'adjust' ? 1 : undefined}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.value}
                  {...register('value')}
                />
                {target.operation === 'adjust' && (
                  <div
                    role="group"
                    aria-label={t('quickAdjust')}
                    className="grid grid-cols-3 gap-2"
                  >
                    {[1, 7, 30, -1, -7, -30].map((days) => {
                      const Icon = days > 0 ? Plus : Minus;
                      const label = t(days > 0 ? 'extendDays' : 'shortenDays', {
                        count: Math.abs(days),
                      });
                      return (
                        <Button
                          key={days}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          aria-label={label}
                          data-llm-text={label}
                          onClick={() =>
                            setValue('value', String(days), {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <Icon aria-hidden="true" />
                          {t('dayCount', { count: Math.abs(days) })}
                        </Button>
                      );
                    })}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {t(target.operation === 'set' ? 'dateHint' : 'daysHint')}
                </p>
                {errors.value?.message && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.value.message}
                  </p>
                )}
              </div>
            ) : (
              <p data-llm-text={t('clearConfirm')}>{t('clearConfirm')}</p>
            )}
            {errors.root?.message && (
              <p
                role="alert"
                className="text-sm text-destructive"
                data-llm-text={errors.root.message}
              >
                {errors.root.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={onClose}
              >
                <X aria-hidden="true" />
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {t(isSubmitting ? 'saving' : 'confirm')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

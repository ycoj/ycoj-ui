'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { throwBackendError } from '@/shared/lib/backend-response';
import type { SudoCapabilities, SudoResult } from '@/shared/types/sudo';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  capabilities: SudoCapabilities;
  onVerified: (response: SudoResult) => void | Promise<void>;
  onCancel: () => void;
};

type VerificationMethod = 'authn' | 'tfa' | 'password';

const methodIcons = {
  authn: KeyRound,
  tfa: Smartphone,
  password: LockKeyhole,
};

export default function SudoConfirmation({
  capabilities,
  onVerified,
  onCancel,
}: Props) {
  const t = useTranslations('sudo');
  const [method, setMethod] = useState<VerificationMethod>(
    capabilities.authn ? 'authn' : capabilities.tfa ? 'tfa' : 'password'
  );
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const methods: VerificationMethod[] = [
    ...(capabilities.authn ? ['authn' as const] : []),
    ...(capabilities.tfa ? ['tfa' as const] : []),
    'password',
  ];
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ value: string }>({
    resolver: zodResolver(
      z.object({
        value:
          method === 'authn'
            ? z.string()
            : method === 'tfa'
              ? z.string().regex(/^\d{6}$/, t('codeRequired'))
              : z.string().min(1, t('passwordRequired')),
      })
    ),
    defaultValues: { value: '' },
  });

  const submit = async ({ value }: { value: string }) => {
    if (busy.current) return;
    busy.current = true;
    try {
      let credential = value;
      if (method === 'authn') {
        if (!window.isSecureContext || !('credentials' in navigator))
          throw new Error(t('unsupported'));
        const { verifySecurityKey } = await import('./verify-security-key');
        credential = await verifySecurityKey('/user/sudo', t('failed'));
      }
      if (!mounted.current) return;
      const response = await ClientApis.Auth.confirmSudo(
        method === 'authn' ? 'authnChallenge' : method,
        credential
      ).send();
      throwBackendError(response);
      if ('error' in response) return;
      if (mounted.current) {
        reset();
        await onVerified(response);
      }
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error && error.message ? error.message : t('failed'),
      });
    } finally {
      busy.current = false;
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(submit)(event)}
      className="space-y-4"
      data-llm-visible="true"
      noValidate
    >
      <p
        className="text-sm text-muted-foreground"
        data-llm-text={t('description')}
      >
        {t('description')}
      </p>
      {methods.length > 1 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('method')}
        >
          {methods.map((option) => {
            const Icon = methodIcons[option];
            return (
              <Button
                key={option}
                type="button"
                variant={method === option ? 'default' : 'outline'}
                aria-pressed={method === option}
                disabled={isSubmitting}
                onClick={() => {
                  setMethod(option);
                  reset();
                }}
              >
                <Icon aria-hidden="true" />
                {t(option)}
              </Button>
            );
          })}
        </div>
      )}
      {method !== 'authn' && (
        <div className="space-y-2">
          <Label htmlFor="sudo-value">{t(method)}</Label>
          <Input
            key={method}
            id="sudo-value"
            type={method === 'password' ? 'password' : 'text'}
            inputMode={method === 'tfa' ? 'numeric' : undefined}
            autoComplete={
              method === 'password' ? 'current-password' : 'one-time-code'
            }
            disabled={isSubmitting}
            aria-invalid={!!errors.value}
            {...register('value')}
          />
          {errors.value?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.value.message}
            </p>
          )}
        </div>
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
          onClick={onCancel}
        >
          <X aria-hidden="true" />
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          {t(isSubmitting ? 'verifying' : 'confirm')}
        </Button>
      </div>
    </form>
  );
}

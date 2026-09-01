'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { throwBackendError } from '@/shared/lib/backend-response';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CircleAlert, KeyRound, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  code: string;
  username?: string;
  initialError?: string;
};

type FormValues = {
  password: string;
  verifyPassword: string;
};

export default function PasswordResetForm({
  code,
  username,
  initialError,
}: Props) {
  const t = useTranslations('auth');
  const [complete, setComplete] = useState(false);
  const schema = z
    .object({
      password: z.string().min(1, t('passwordRequired')),
      verifyPassword: z.string().min(1, t('passwordRequired')),
    })
    .refine((values) => values.password === values.verifyPassword, {
      path: ['verifyPassword'],
      message: t('passwordMismatch'),
    });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', verifyPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await ClientApis.Auth.completePasswordReset({
        code,
        ...values,
      }).send();
      throwBackendError(response);
      const target =
        'url' in response && response.url ? response.url : '/login';
      setComplete(true);
      window.location.assign(target);
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error && error.message
            ? error.message
            : t('resetCompleteFailed'),
      });
    }
  };

  if (initialError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('resetTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p
            className="flex items-start gap-2 text-sm text-destructive"
            role="alert"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {initialError}
          </p>
          <Button asChild variant="secondary">
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (complete) {
    return (
      <Card className="w-full">
        <CardContent
          className="flex items-start gap-2 py-6 text-sm"
          role="status"
        >
          <Check
            className="mt-0.5 size-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          {t('resetComplete')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('resetTitle')}</CardTitle>
        <CardDescription>
          {username ? t('resetForUser', { username }) : t('resetDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="reset-password">{t('newPassword')}</FieldLabel>
            <FieldContent>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </FieldContent>
          </Field>
          <Field data-invalid={!!errors.verifyPassword}>
            <FieldLabel htmlFor="reset-password-confirm">
              {t('repeatPassword')}
            </FieldLabel>
            <FieldContent>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={!!errors.verifyPassword}
                {...register('verifyPassword')}
              />
              <FieldError errors={[errors.verifyPassword]} />
            </FieldContent>
          </Field>
          {errors.root?.message && (
            <p className="text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="secondary">
              <Link href="/login">{t('backToLogin')}</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound aria-hidden="true" />
              )}
              {isSubmitting ? t('resetting') : t('resetPassword')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

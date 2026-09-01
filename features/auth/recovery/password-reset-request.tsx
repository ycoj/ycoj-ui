'use client';

import ClientApis from '@/api/client/method';
import SiteFooter from '@/shared/components/site-footer';
import ThemeLogo from '@/shared/components/theme-logo';
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
import { Check, LoaderCircle, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type FormValues = { mail: string };

const siteName = process.env.SITE_NAME ?? '';

export default function PasswordResetRequest() {
  const t = useTranslations('auth');
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      z.object({ mail: z.string().trim().email(t('emailInvalid')) })
    ),
    defaultValues: { mail: '' },
  });

  const onSubmit = async ({ mail }: FormValues) => {
    try {
      const response = await ClientApis.Auth.requestPasswordReset(mail).send();
      throwBackendError(response);
      setSent(true);
    } catch (error) {
      setError('root', {
        message:
          error instanceof Error && error.message
            ? error.message
            : t('resetRequestFailed'),
      });
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <ThemeLogo
          alt={t('logoAlt', { siteName })}
          fetchPriority="high"
          width={290}
          height={87}
          sizes="160px"
          className="h-auto w-[160px]"
        />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('resetTitle')}</CardTitle>
            <CardDescription>{t('resetDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="flex items-start gap-2 text-sm" role="status">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {t('resetSent')}
                </p>
                <Button asChild variant="secondary">
                  <Link href="/login">{t('backToLogin')}</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <Field data-invalid={!!errors.mail}>
                  <FieldLabel htmlFor="reset-mail">{t('email')}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="reset-mail"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder={t('emailPlaceholder')}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.mail}
                      {...register('mail')}
                    />
                    <FieldError errors={[errors.mail]} />
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
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Send aria-hidden="true" />
                    )}
                    {isSubmitting ? t('sending') : t('sendReset')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-2">
        <SiteFooter />
      </div>
    </div>
  );
}

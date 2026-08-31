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
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type LoginFormValues = {
  uname: string;
  password: string;
  rememberme: boolean;
};

const siteName = process.env.SITE_NAME ?? '';

export function LoginPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeightVar = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight ?? 0;
      el.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
    };

    updateHeightVar();

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateHeightVar);
    visualViewport?.addEventListener('scroll', updateHeightVar);
    window.addEventListener('resize', updateHeightVar);
    window.addEventListener('orientationchange', updateHeightVar);

    return () => {
      visualViewport?.removeEventListener('resize', updateHeightVar);
      visualViewport?.removeEventListener('scroll', updateHeightVar);
      window.removeEventListener('resize', updateHeightVar);
      window.removeEventListener('orientationchange', updateHeightVar);
    };
  }, []);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      uname: '',
      password: '',
      rememberme: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      const redirect = searchParams?.get('redirect') || undefined;
      const response = await ClientApis.Auth.login({
        ...values,
        redirect,
      }).send();
      const redirectUrl = (response as { url?: string })?.url;

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      throw new Error(t('auth.loginError'));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('auth.retryError');
      setSubmitError(message);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ minHeight: 'var(--app-height, 100dvh)' }}
      className="flex items-start justify-center overflow-y-auto px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:items-center sm:py-0"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <ThemeLogo
          alt={t('misc.logoAlt', { siteName })}
          fetchPriority="high"
          width={290}
          height={87}
          sizes="160px"
          className="h-auto w-[160px]"
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('auth.loginTitle')}</CardTitle>
            <CardDescription>
              {t('auth.loginDescription', { siteName })}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="uname">{t('auth.username')}</FieldLabel>
                <FieldContent>
                  <Input
                    id="uname"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={t('auth.usernamePlaceholder')}
                    aria-invalid={!!errors.uname}
                    disabled={isSubmitting}
                    {...register('uname', {
                      required: t('auth.usernamePlaceholder'),
                    })}
                  />
                  <FieldError errors={[errors.uname]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    {...register('password', {
                      required: t('auth.passwordPlaceholder'),
                    })}
                  />
                  <FieldError errors={[errors.password]} />
                </FieldContent>
              </Field>

              <div className="flex items-center justify-between">
                <Controller
                  control={control}
                  name="rememberme"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="rememberme"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="rememberme" className="text-sm">
                        {t('auth.rememberMe')}
                      </Label>
                    </div>
                  )}
                />
              </div>

              {submitError && (
                <p className="text-destructive text-sm">{submitError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('auth.loggingIn') : t('common.login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-2">
        <SiteFooter />
      </div>
    </div>
  );
}

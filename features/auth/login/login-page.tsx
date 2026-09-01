'use client';

import { verifyLoginSecurityKey } from './verify-login-security-key';
import ClientApis from '@/api/client/method';
import type {
  LoginFactors,
  LoginRequest,
} from '@/api/client/method/auth/login';
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
import { throwBackendError } from '@/shared/lib/backend-response';
import {
  ArrowLeft,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type LoginFormValues = {
  uname: string;
  password: string;
  rememberme: boolean;
};

type ChallengeMethod = 'authn' | 'tfa';

type ChallengeProps = {
  credentials: LoginFormValues;
  factors: LoginFactors;
  redirect?: string;
  onBack: () => void;
};

const siteName = process.env.SITE_NAME ?? '';

function LoginChallenge({
  credentials,
  factors,
  redirect,
  onBack,
}: ChallengeProps) {
  const t = useTranslations('auth');
  const methods: ChallengeMethod[] = [
    ...(factors.authn ? (['authn'] as const) : []),
    ...(factors.tfa ? (['tfa'] as const) : []),
  ];
  const [method, setMethod] = useState<ChallengeMethod>(methods[0] ?? 'tfa');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ code: string }>({ defaultValues: { code: '' } });

  const submitLogin = async (
    extra: Pick<LoginRequest, 'tfa' | 'authnChallenge'>
  ) => {
    const response = await ClientApis.Auth.login({
      ...credentials,
      redirect,
      ...extra,
    }).send();
    throwBackendError(response);
    if (!('url' in response) || typeof response.url !== 'string')
      throw new Error(t('loginError'));
    window.location.assign(response.url);
  };

  const onSubmit = async ({ code }: { code: string }) => {
    setSubmitError(null);
    try {
      if (method === 'authn') {
        if (!window.isSecureContext || !('credentials' in navigator))
          throw new Error(t('webauthnUnsupported'));
        const challenge = await verifyLoginSecurityKey(
          credentials.uname,
          t('webauthnFailed')
        );
        await submitLogin({ authnChallenge: challenge });
      } else {
        await submitLogin({ tfa: code });
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : t('challengeFailed')
      );
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      {methods.length > 1 && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('challengeMethod')}
        >
          {methods.map((option) => (
            <Button
              key={option}
              type="button"
              variant={method === option ? 'default' : 'outline'}
              aria-pressed={method === option}
              disabled={isSubmitting}
              onClick={() => {
                setMethod(option);
                setSubmitError(null);
                reset();
              }}
            >
              {option === 'authn' ? (
                <KeyRound aria-hidden="true" />
              ) : (
                <Smartphone aria-hidden="true" />
              )}
              {t(option)}
            </Button>
          ))}
        </div>
      )}

      {method === 'tfa' && (
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="tfa-code">{t('tfaCode')}</FieldLabel>
          <FieldContent>
            <Input
              id="tfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              disabled={isSubmitting}
              aria-invalid={!!errors.code}
              {...register('code', {
                required: t('tfaCodeRequired'),
                pattern: { value: /^\d{6}$/, message: t('tfaCodeRequired') },
              })}
            />
            <FieldError errors={[errors.code]} />
          </FieldContent>
        </Field>
      )}

      {method === 'authn' && (
        <p className="text-sm text-muted-foreground">
          {t('webauthnDescription')}
        </p>
      )}

      {submitError && (
        <p className="text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" />
          {t('backToLogin')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          {isSubmitting ? t('verifying') : t('verify')}
        </Button>
      </div>
    </form>
  );
}

export function LoginPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{
    credentials: LoginFormValues;
    factors: LoginFactors;
  } | null>(null);
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
    defaultValues: { uname: '', password: '', rememberme: false },
  });

  const submitLogin = async (values: LoginFormValues) => {
    const redirect = searchParams?.get('redirect') || undefined;
    const factorsResponse = await ClientApis.Auth.getLoginFactors(
      values.uname
    ).send();
    throwBackendError(factorsResponse);
    if (!('authn' in factorsResponse) || !('tfa' in factorsResponse))
      throw new Error(t('challengeFailed'));

    if (factorsResponse.authn || factorsResponse.tfa) {
      setChallenge({ credentials: values, factors: factorsResponse });
      return;
    }

    const response = await ClientApis.Auth.login({
      ...values,
      redirect,
    }).send();
    throwBackendError(response);
    if (!('url' in response) || typeof response.url !== 'string')
      throw new Error(t('loginError'));
    window.location.assign(response.url);
  };

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    try {
      await submitLogin(values);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : t('retryError')
      );
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
          alt={t('logoAlt', { siteName })}
          fetchPriority="high"
          width={290}
          height={87}
          sizes="160px"
          className="h-auto w-[160px]"
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {challenge ? t('challengeTitle') : t('loginTitle')}
            </CardTitle>
            <CardDescription>
              {challenge
                ? t('challengeDescription', {
                    uname: challenge.credentials.uname,
                  })
                : t('loginDescription', { siteName })}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {challenge ? (
              <LoginChallenge
                credentials={challenge.credentials}
                factors={challenge.factors}
                redirect={searchParams?.get('redirect') || undefined}
                onBack={() => {
                  setChallenge(null);
                  setSubmitError(null);
                }}
              />
            ) : (
              <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <Field data-invalid={!!errors.uname}>
                  <FieldLabel htmlFor="uname">{t('username')}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="uname"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={t('usernamePlaceholder')}
                      aria-invalid={!!errors.uname}
                      disabled={isSubmitting}
                      {...register('uname', {
                        required: t('usernamePlaceholder'),
                      })}
                    />
                    <FieldError errors={[errors.uname]} />
                  </FieldContent>
                </Field>

                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                  <FieldContent>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('passwordPlaceholder')}
                      aria-invalid={!!errors.password}
                      disabled={isSubmitting}
                      {...register('password', {
                        required: t('passwordPlaceholder'),
                      })}
                    />
                    <FieldError errors={[errors.password]} />
                  </FieldContent>
                </Field>

                <div className="flex items-center justify-between gap-3">
                  <Controller
                    control={control}
                    name="rememberme"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="rememberme"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!!checked)
                          }
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="rememberme" className="text-sm">
                          {t('rememberMe')}
                        </Label>
                      </div>
                    )}
                  />
                  <Link
                    href="/lostpass"
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>

                {submitError && (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('loggingIn') : t('login')}
                </Button>
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

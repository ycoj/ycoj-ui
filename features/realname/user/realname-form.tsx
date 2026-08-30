'use client';

import ClientApis from '@/api/client/method';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { RealnamePageData } from '@/shared/types/realname';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, Clock3, Send, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  data: RealnamePageData;
};

type FormValues = {
  realName: string;
  school: string;
};

export default function RealnameForm({ data }: Props) {
  const t = useTranslations('realname');
  const locale = useLocale();
  const router = useRouter();
  const schema = z.object({
    realName: z
      .string()
      .trim()
      .min(2, t('validation.realNameMin'))
      .max(64, t('validation.realNameMax')),
    school: z
      .string()
      .trim()
      .min(2, t('validation.schoolMin'))
      .max(128, t('validation.schoolMax')),
  });
  const {
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      realName: data.realName,
      school: data.school,
    },
  });

  if (data.exempt) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" data-llm-visible="true">
        <h1 className="text-2xl font-semibold" data-llm-text={t('title')}>
          {t('title')}
        </h1>
        <Alert>
          <ShieldCheck />
          <AlertTitle data-llm-text={t('exemptTitle')}>
            {t('exemptTitle')}
          </AlertTitle>
          <AlertDescription data-llm-text={t('exemptDescription')}>
            {t('exemptDescription')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const deadline = data.graceUntil
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(data.graceUntil))
    : null;
  const onSubmit = async (values: FormValues) => {
    try {
      const response = await ClientApis.Realname.submitRealname(values).send();
      router.push(response.url || '/home/realname/result');
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof Error && error.message
            ? error.message
            : t('form.submitFailed'),
      });
    }
  };
  const isUpdate = data.status === 'pending' || data.status === 'rejected';

  const form = (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle data-llm-text={t('form.title')}>{t('form.title')}</CardTitle>
        <CardDescription data-llm-text={t('form.description')}>
          {t('form.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.status === 'rejected' && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle data-llm-text={t('rejectedTitle')}>
              {t('rejectedTitle')}
            </AlertTitle>
            <AlertDescription>
              <span data-llm-text={t('rejectedDescription')}>
                {t('rejectedDescription')}
              </span>
              {data.application?.rejectReason && (
                <p
                  className="mt-1"
                  data-llm-text={t('reasonWithValue', {
                    reason: data.application.rejectReason,
                  })}
                >
                  {t('reasonWithValue', {
                    reason: data.application.rejectReason,
                  })}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
        {data.inGrace && deadline && (
          <Alert>
            <Clock3 />
            <AlertTitle data-llm-text={t('grace.title')}>
              {t('grace.title')}
            </AlertTitle>
            <AlertDescription data-llm-text={t('grace.until', { deadline })}>
              {t('grace.until', { deadline })}
            </AlertDescription>
          </Alert>
        )}
        <form
          className="space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field data-invalid={!!errors.realName}>
            <FieldLabel htmlFor="realName">{t('form.realName')}</FieldLabel>
            <FieldContent>
              <Input
                id="realName"
                autoFocus
                autoComplete="name"
                maxLength={64}
                disabled={isSubmitting}
                aria-invalid={!!errors.realName}
                {...register('realName')}
              />
              <FieldDescription>{t('form.realNameHelp')}</FieldDescription>
              <FieldError errors={[errors.realName]} />
            </FieldContent>
          </Field>
          <Field data-invalid={!!errors.school}>
            <FieldLabel htmlFor="school">{t('form.school')}</FieldLabel>
            <FieldContent>
              <Input
                id="school"
                autoComplete="organization"
                maxLength={128}
                disabled={isSubmitting}
                aria-invalid={!!errors.school}
                {...register('school')}
              />
              <FieldDescription>{t('form.schoolHelp')}</FieldDescription>
              <FieldError errors={[errors.school]} />
            </FieldContent>
          </Field>
          {errors.root?.serverError?.message && (
            <p
              className="text-sm text-destructive"
              role="alert"
              data-llm-text={errors.root.serverError.message}
            >
              {errors.root.serverError.message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              <Send />
              {isSubmitting
                ? t('form.submitting')
                : t(isUpdate ? 'form.update' : 'form.submit')}
            </Button>
            {isUpdate && (
              <Button asChild type="button" variant="secondary">
                <Link href="/home/realname/result">{t('viewResult')}</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const help = (
    <aside className="space-y-3 text-sm" data-llm-visible="true">
      <h2 className="font-semibold" data-llm-text={t('help.title')}>
        {t('help.title')}
      </h2>
      <p className="text-muted-foreground" data-llm-text={t('help.review')}>
        {t('help.review')}
      </p>
      <p className="text-muted-foreground" data-llm-text={t('help.update')}>
        {t('help.update')}
      </p>
      <p className="text-muted-foreground" data-llm-text={t('help.resubmit')}>
        {t('help.resubmit')}
      </p>
    </aside>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" data-llm-text={t('title')}>
          {t('title')}
        </h1>
        <p
          className="mt-1 text-sm text-muted-foreground"
          data-llm-text={t('description')}
        >
          {t('description')}
        </p>
      </div>
      <TwoColumnLayout left={form} right={help} ratio="7-3" gap="gap-6" />
    </div>
  );
}

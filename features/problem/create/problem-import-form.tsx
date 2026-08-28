'use client';

import ClientApis from '@/api/client/method';
import type { ProblemImportFormat } from '@/api/client/method/problem/import';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowLeft, FileArchive, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';

type Props = {
  format: ProblemImportFormat;
  canKeepUser: boolean;
};

type FormValues = {
  file?: FileList;
  oj: string;
  pid: string;
  preferredPrefix: string;
  hidden: boolean;
  keepUser: boolean;
};

const acceptByFormat: Record<ProblemImportFormat, string> = {
  hydro: '.zip,application/zip',
  fps: '.xml,.zip,application/xml,text/xml,application/zip',
  hoj: '.zip,application/zip',
  qduoj: '.zip,application/zip',
  lvj: '',
};

const lvjOjs = [
  ['CF', 'Codeforces'],
  ['LG', '洛谷'],
  ['LGB', '洛谷入门'],
  ['HDU', 'HDU'],
  ['LOOJ', 'LOJ'],
  ['POJ', 'POJ'],
  ['UOJ', 'UOJ'],
  ['UVA', 'UVA'],
  ['YBT', 'YBT'],
  ['YBTBAS', 'YBT启蒙'],
] as const;

export default function ProblemImportForm({ format, canKeepUser }: Props) {
  const t = useTranslations('problemImport');
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      oj: 'CF',
      pid: '',
      preferredPrefix: '',
      hidden: false,
      keepUser: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (format === 'lvj') {
      if (!values.pid.trim()) {
        setError('pid', { type: 'required', message: t('pidRequired') });
        return;
      }
    } else {
      const file = values.file?.[0];
      if (!file) {
        setError('file', { type: 'required', message: t('fileRequired') });
        return;
      }
    }

    try {
      if (format === 'lvj') {
        await ClientApis.Problem.importProblems(format, {
          oj: values.oj,
          pid: values.pid.trim(),
        }).send();
      } else {
        await ClientApis.Problem.importProblems(format, {
          file: values.file![0],
          preferredPrefix: values.preferredPrefix.trim() || undefined,
          hidden: values.hidden,
          keepUser: canKeepUser && values.keepUser,
        }).send();
      }
      router.push('/problem');
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof Error ? error.message : t('importFailed'),
      });
    }
  };

  return (
    <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="min-w-0 space-y-6" data-llm-visible="true">
        <header className="space-y-1">
          <h1
            className="flex items-center gap-2 text-xl font-semibold"
            data-llm-text={t('title', { format: t(`formats.${format}`) })}
          >
            <FileArchive className="text-muted-foreground size-5" />
            {t('title', { format: t(`formats.${format}`) })}
          </h1>
          <p
            className="text-muted-foreground text-sm"
            data-llm-text={t(`descriptions.${format}`)}
          >
            {t(`descriptions.${format}`)}
          </p>
        </header>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {format === 'lvj' ? (
            <>
              <Field>
                <FieldLabel htmlFor="oj">{t('oj')}</FieldLabel>
                <FieldContent>
                  <select
                    id="oj"
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    disabled={isSubmitting}
                    {...register('oj')}
                  >
                    {lvjOjs.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label} ({value})
                      </option>
                    ))}
                  </select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="pid">{t('pid')}</FieldLabel>
                <FieldContent>
                  <Input
                    id="pid"
                    placeholder={t('pidPlaceholder')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.pid}
                    {...register('pid')}
                  />
                  <FieldDescription>{t('pidHelp')}</FieldDescription>
                  <FieldError errors={[errors.pid]} />
                </FieldContent>
              </Field>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor="file">{t('file')}</FieldLabel>
              <FieldContent>
                <Input
                  id="file"
                  type="file"
                  accept={acceptByFormat[format]}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.file}
                  {...register('file', { required: t('fileRequired') })}
                />
                <FieldDescription>{t(`fileHelp.${format}`)}</FieldDescription>
                <FieldError errors={[errors.file]} />
              </FieldContent>
            </Field>
          )}

          {format === 'hydro' && (
            <Field>
              <FieldLabel htmlFor="preferredPrefix">
                {t('preferredPrefix')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="preferredPrefix"
                  placeholder={t('preferredPrefixPlaceholder')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.preferredPrefix}
                  {...register('preferredPrefix', {
                    pattern: {
                      value: /^[a-zA-Z]*$/,
                      message: t('preferredPrefixInvalid'),
                    },
                  })}
                />
                <FieldDescription>{t('preferredPrefixHelp')}</FieldDescription>
                <FieldError errors={[errors.preferredPrefix]} />
              </FieldContent>
            </Field>
          )}

          <FieldError errors={[errors.root?.serverError]} />

          {format === 'hydro' && (
            <div className="grid items-start gap-3 sm:grid-cols-2 sm:gap-6">
              <Controller
                control={control}
                name="hidden"
                render={({ field }) => (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="import-hidden"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                      disabled={isSubmitting}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="import-hidden"
                      className="flex flex-col items-start gap-0.5"
                    >
                      <span>{t('hidden')}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {t('hiddenHelp')}
                      </span>
                    </Label>
                  </div>
                )}
              />

              {canKeepUser && (
                <Controller
                  control={control}
                  name="keepUser"
                  render={({ field }) => (
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="keep-user"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                        disabled={isSubmitting}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="keep-user"
                        className="flex flex-col items-start gap-0.5"
                      >
                        <span>{t('keepUser')}</span>
                        <span className="text-muted-foreground text-xs font-normal">
                          {t('keepUserHelp')}
                        </span>
                      </Label>
                    </div>
                  )}
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Upload />
              {isSubmitting ? t('importing') : t('import')}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/problem">
                <ArrowLeft />
                {t('cancel')}
              </Link>
            </Button>
          </div>
        </form>
      </section>

      <aside className="bg-muted/40 space-y-3 rounded-lg p-4 lg:sticky lg:top-4">
        <h2 className="font-medium" data-llm-text={t('about')}>
          {t('about')}
        </h2>
        <div className="text-muted-foreground space-y-3 text-sm">
          <p data-llm-text={t(`aboutText.${format}`)}>
            {t(`aboutText.${format}`)}
          </p>
          {format === 'fps' && (
            <p data-llm-text={t('fpsMemoryWarning')}>{t('fpsMemoryWarning')}</p>
          )}
          <p data-llm-text={t('importNotice')}>{t('importNotice')}</p>
        </div>
      </aside>
    </div>
  );
}

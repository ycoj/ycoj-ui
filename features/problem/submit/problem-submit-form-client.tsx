'use client';

import ClientApis from '@/api/client/method';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigation, Link2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  pid: string;
  tid?: string;
  languages: Record<string, LanguageFamily>;
  isContestEnded?: boolean;
};

const baseSchema = z.object({
  familyKey: z.string().min(1, '请选择语言'),
  lang: z.string().min(1, '请选择版本'),
  code: z.string().trim().min(1, '请输入代码'),
});

type FormValues = z.infer<typeof baseSchema>;

export default function ProblemSubmitFormClient({
  pid,
  tid,
  languages,
  isContestEnded,
}: Props) {
  const router = useRouter();

  const preferredFamilyKey = 'cc';
  const preferredLang = 'cc.cc14o2';

  const defaultFamilyKey = useMemo(() => {
    if (languages[preferredFamilyKey]) return preferredFamilyKey;
    return Object.keys(languages)[0] ?? '';
  }, [languages]);

  const defaultLang = useMemo(() => {
    const family = defaultFamilyKey ? languages[defaultFamilyKey] : undefined;
    if (!family) return '';

    if (
      defaultFamilyKey === preferredFamilyKey &&
      family.versions.some((v) => v.name === preferredLang)
    ) {
      return preferredLang;
    }

    return family.versions[0]?.name ?? '';
  }, [defaultFamilyKey, languages, preferredFamilyKey, preferredLang]);

  const schema = useMemo(
    () =>
      baseSchema.superRefine(
        (values: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) => {
          const family = languages[values.familyKey];
          if (!family) {
            ctx.addIssue({
              code: 'custom',
              path: ['familyKey'],
              message: '请选择语言',
            });
            return;
          }

          if (!family.versions.some((v) => v.name === values.lang)) {
            ctx.addIssue({
              code: 'custom',
              path: ['lang'],
              message: '请选择版本',
            });
          }
        }
      ),
    [languages]
  );

  const {
    control,
    register,
    getValues,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      familyKey: defaultFamilyKey,
      lang: defaultLang,
      code: '',
    },
  });

  const familyKey = useWatch({ control, name: 'familyKey' }) ?? '';
  const selectedFamily = familyKey ? languages[familyKey] : undefined;

  useEffect(() => {
    if (getValues('familyKey')) return;
    if (!defaultFamilyKey) return;

    setValue('familyKey', defaultFamilyKey, { shouldValidate: true });
    setValue('lang', defaultLang, { shouldValidate: true });
  }, [defaultFamilyKey, defaultLang, getValues, setValue]);

  useEffect(() => {
    const currentLang = getValues('lang');
    const versions = selectedFamily?.versions ?? [];

    if (!selectedFamily) {
      if (currentLang) {
        setValue('lang', '', { shouldValidate: true });
      }
      return;
    }

    const stillValid = versions.some((v) => v.name === currentLang);
    if (stillValid) return;

    const nextLang =
      familyKey === preferredFamilyKey &&
      versions.some((v) => v.name === preferredLang)
        ? preferredLang
        : (versions[0]?.name ?? '');

    setValue('lang', nextLang, { shouldValidate: true });
  }, [
    familyKey,
    getValues,
    preferredFamilyKey,
    preferredLang,
    selectedFamily,
    setValue,
  ]);

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await ClientApis.Problem.submitProblem(pid, {
        lang: values.lang,
        code: values.code,
        ...(tid ? { tid } : {}),
      }).send();

      if (res?.rid) {
        router.push(`/record/${res.rid}`);
        return;
      }

      setError('root.serverError', {
        type: 'server',
        message: '提交失败',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '提交失败，请稍后重试';
      setError('root.serverError', {
        type: 'server',
        message,
      });
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {isContestEnded && (
        <Alert
          className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
          data-llm-visible="true"
        >
          <Info className="size-4" strokeWidth={2} />
          <AlertTitle data-llm-text="比赛已结束">比赛已结束</AlertTitle>
          <AlertDescription data-llm-text="比赛已结束，你可以选择在题库中打开本题">
            比赛已结束，你可以选择在题库中打开本题。
          </AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <div className="flex flex-wrap gap-6">
          <Controller
            control={control}
            name="familyKey"
            render={({ field }) => (
              <Field className="w-auto flex-none">
                <FieldLabel htmlFor="family-select">语言</FieldLabel>
                <FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || isContestEnded}
                  >
                    <SelectTrigger
                      id="family-select"
                      aria-invalid={!!errors.familyKey}
                      className="w-60"
                    >
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(languages).map(([key, fam]) => (
                        <SelectItem key={key} value={key}>
                          {fam.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.familyKey]} />
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="lang"
            render={({ field }) => (
              <Field className="w-auto flex-none">
                <FieldLabel htmlFor="version-select">版本</FieldLabel>
                <FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedFamily || isSubmitting || isContestEnded}
                  >
                    <SelectTrigger
                      id="version-select"
                      aria-invalid={!!errors.lang}
                      className="w-60"
                    >
                      <SelectValue placeholder="选择版本" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFamily?.versions.map((l) => (
                        <SelectItem key={l.name} value={l.name}>
                          {l.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.lang]} />
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <Field>
          <FieldLabel htmlFor="code-input">代码</FieldLabel>
          <FieldContent>
            <Textarea
              id="code-input"
              placeholder="在此粘贴代码..."
              className="min-h-[320px] max-h-[600px] font-mono"
              aria-invalid={!!errors.code}
              disabled={isSubmitting || isContestEnded}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="none"
              {...register('code')}
            />
            <FieldError errors={[errors.code]} />
          </FieldContent>
        </Field>
      </FieldGroup>

      <FieldError errors={[errors.root?.serverError]} />

      {!isContestEnded ? (
        <Button
          size="lg"
          type="submit"
          className="w-30 gap-3"
          disabled={isSubmitting}
        >
          <Navigation strokeWidth={2} data-icon="inline-start" />
          {isSubmitting ? '提交中...' : '提交'}
        </Button>
      ) : (
        <Button size="lg" asChild className="w-auto gap-3">
          <Link href={`/problem/${pid}`}>
            <Link2 strokeWidth={2} data-icon="inline-start" />
            在题库中打开
          </Link>
        </Button>
      )}
    </form>
  );
}

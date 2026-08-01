'use client';

import ClientApis from '@/api/client/method';
import MarkdownEditor from '@/shared/components/markdown-editor';
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
import { PROBLEMS_DIFFICULTY_KEYS } from '@/shared/configs/difficulty';
import { cn } from '@/shared/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Plus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const DEFAULT_CONTENT = `# Background

Describe the background of the problem.

# Description

Describe the task to be solved.

# Input Format

Describe the input format.

# Output Format

Describe the output format.

# Samples

\`\`\`input1

\`\`\`

\`\`\`output1

\`\`\`

# Hint

Add any additional explanation here.`;

const SUGGESTED_TAGS = [
  'dynamicProgramming',
  'search',
  'computationalGeometry',
  'greedy',
  'tree',
  'graph',
  'numberTheory',
  'simulation',
  'dataStructures',
  'string',
  'linearAlgebra',
  'highPrecision',
  'recursion',
  'probability',
] as const;

const MAX_DIFFICULTY = 7;

type FormValues = {
  pid: string;
  title: string;
  tag: string;
  difficulty: number;
  hidden: boolean;
  content: string;
};

export default function ProblemCreateForm() {
  const t = useTranslations('problemCreate');
  const difficulty = useTranslations('difficulty');
  const router = useRouter();
  const schema = z.object({
    pid: z
      .string()
      .trim()
      .refine(
        (value) =>
          !value || /^(?:[a-z0-9]{1,10}-)?[a-z][a-z0-9]*$/i.test(value),
        t('invalidPid')
      ),
    title: z.string().trim().min(1, t('titleRequired')),
    tag: z.string(),
    difficulty: z.number().int().min(0).max(MAX_DIFFICULTY),
    hidden: z.boolean(),
    content: z.string().trim().min(1, t('contentRequired')),
  });
  const {
    control,
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pid: '',
      title: '',
      tag: '',
      difficulty: 0,
      hidden: false,
      content: DEFAULT_CONTENT,
    },
  });
  const currentTags = watch('tag')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const toggleTag = (tag: string) => {
    const nextTags = currentTags.includes(tag)
      ? currentTags.filter((item) => item !== tag)
      : [...currentTags, tag];
    setValue('tag', nextTags.join(', '), { shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await ClientApis.Problem.createProblem({
        ...values,
        pid: values.pid.trim() || undefined,
        title: values.title.trim(),
        tag: values.tag.trim(),
      }).send();

      if (response?.pid !== undefined) {
        router.push(`/problem/${response.pid}`);
        return;
      }

      throw new Error(t('createFailed'));
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof Error ? error.message : t('createFailed'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"
      data-llm-visible="true"
    >
      <section className="min-w-0 space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold" data-llm-text={t('title')}>
            {t('title')}
          </h1>
          <p
            className="text-muted-foreground text-sm"
            data-llm-text={t('description')}
          >
            {t('description')}
          </p>
        </header>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
            <Field>
              <FieldLabel htmlFor="pid">{t('problemId')}</FieldLabel>
              <FieldContent>
                <Input
                  id="pid"
                  placeholder="P1000"
                  autoCapitalize="characters"
                  aria-invalid={!!errors.pid}
                  disabled={isSubmitting}
                  {...register('pid')}
                />
                <FieldError errors={[errors.pid]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="title">{t('problemTitle')}</FieldLabel>
              <FieldContent>
                <Input
                  id="title"
                  placeholder={t('titlePlaceholder')}
                  aria-invalid={!!errors.title}
                  disabled={isSubmitting}
                  {...register('title')}
                />
                <FieldError errors={[errors.title]} />
              </FieldContent>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <Field>
              <FieldLabel htmlFor="tag">{t('tags')}</FieldLabel>
              <FieldContent>
                <Input
                  id="tag"
                  placeholder={t('tagsPlaceholder')}
                  disabled={isSubmitting}
                  {...register('tag')}
                />
                <FieldDescription>{t('tagsHelp')}</FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="difficulty">{t('difficulty')}</FieldLabel>
              <select
                id="difficulty"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                disabled={isSubmitting}
                {...register('difficulty', { valueAsNumber: true })}
              >
                {PROBLEMS_DIFFICULTY_KEYS.slice(0, MAX_DIFFICULTY + 1).map(
                  (key, level) => (
                    <option key={level} value={level}>
                      {difficulty(key)}
                    </option>
                  )
                )}
              </select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="content">{t('statement')}</FieldLabel>
            <FieldContent>
              <MarkdownEditor
                {...register('content')}
                defaultValue={DEFAULT_CONTENT}
                disabled={isSubmitting}
                aria-invalid={!!errors.content}
                className="min-h-120"
              />
              <FieldError errors={[errors.content]} />
            </FieldContent>
          </Field>

          <FieldError errors={[errors.root?.serverError]} />

          <Controller
            control={control}
            name="hidden"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hidden"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="hidden">{t('hidden')}</Label>
              </div>
            )}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Plus />
              {isSubmitting ? t('creating') : t('create')}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/problem">
                <ArrowLeft />
                {t('cancel')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <aside className="bg-muted/40 space-y-4 rounded-lg p-4 lg:sticky lg:top-4">
        <header className="space-y-1">
          <h2
            className="flex items-center gap-2 font-medium"
            data-llm-text={t('suggestedTags')}
          >
            <Sparkles className="text-muted-foreground size-4" />
            {t('suggestedTags')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('suggestedTagsDescription')}
          </p>
        </header>
        <div className="grid grid-cols-2 gap-2">
          {SUGGESTED_TAGS.map((tagKey) => {
            const tag = t(`tagSuggestions.${tagKey}`);
            const selected = currentTags.includes(tag);
            return (
              <button
                key={tagKey}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'bg-background hover:bg-muted flex min-h-8 items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                  selected && 'bg-secondary font-medium'
                )}
                aria-pressed={selected}
                disabled={isSubmitting}
              >
                <span data-llm-text={tag}>{tag}</span>
                {selected && <Check className="size-3.5" />}
              </button>
            );
          })}
        </div>
      </aside>
    </form>
  );
}

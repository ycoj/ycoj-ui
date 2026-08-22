'use client';

import ProblemContentEditor from '@/features/problem/form/problem-content-editor';
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
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const MAX_DIFFICULTY = 7;

export type ProblemFormValues = {
  pid: string;
  title: string;
  tag: string;
  difficulty: number;
  hidden: boolean;
  content: string;
};

type Props = {
  mode: 'create' | 'edit';
  tags: Record<string, string[]>;
  defaultValues: ProblemFormValues;
  cancelHref: string;
  onSubmit: (values: ProblemFormValues) => Promise<string>;
};

export default function ProblemForm({
  mode,
  tags,
  defaultValues,
  cancelHref,
  onSubmit,
}: Props) {
  const t = useTranslations(
    mode === 'create' ? 'problemCreate' : 'problemEdit'
  );
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
    formState: { errors, isSubmitting },
  } = useForm<ProblemFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const currentTags = (useWatch({ control, name: 'tag' }) ?? '')
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const updateTags = (nextTags: string[]) => {
    setValue('tag', nextTags.join(', '), { shouldDirty: true });
  };

  const toggleTag = (tag: string) => {
    updateTags(
      currentTags.includes(tag)
        ? currentTags.filter((item) => item !== tag)
        : [...currentTags, tag]
    );
  };

  const toggleChildTag = (category: string, child: string) => {
    if (currentTags.includes(category) && currentTags.includes(child)) {
      updateTags(currentTags.filter((tag) => tag !== child));
      return;
    }

    updateTags([...new Set([...currentTags, category, child])]);
  };

  const handleFormSubmit = async (values: ProblemFormValues) => {
    try {
      const path = await onSubmit(values);
      router.push(path);
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof Error ? error.message : t('submitFailed'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]"
      data-llm-visible="true"
    >
      <section className="min-w-0 space-y-6">
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
            <FieldLabel>{t('statement')}</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <ProblemContentEditor
                    defaultValue={defaultValues.content}
                    disabled={isSubmitting}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.content}
                    className="min-h-120"
                  />
                )}
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
              {mode === 'create' ? <Plus /> : <Save />}
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href={cancelHref}>
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
          {Object.entries(tags).map(([category, childTags], categoryIndex) => {
            const selected = currentTags.includes(category);
            return (
              <div key={category} className="group/category relative">
                <button
                  type="button"
                  onClick={() => toggleTag(category)}
                  className={cn(
                    'bg-background hover:bg-muted flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                    selected && 'bg-secondary font-medium'
                  )}
                  aria-pressed={selected}
                  disabled={isSubmitting}
                >
                  <span data-llm-text={category}>{category}</span>
                  <span className="flex items-center gap-1">
                    {selected && <Check className="size-3.5" />}
                    {childTags.length > 0 && (
                      <ChevronLeft className="text-muted-foreground size-3.5" />
                    )}
                  </span>
                </button>

                {childTags.length > 0 && (
                  <div
                    className={cn(
                      'bg-popover invisible absolute right-full z-20 grid max-h-[calc(100vh-2rem)] w-72 grid-cols-2 gap-1 overflow-y-auto rounded-lg p-2 opacity-0 shadow-lg transition-[visibility,opacity] group-focus-within/category:visible group-focus-within/category:opacity-100 group-hover/category:visible group-hover/category:opacity-100',
                      categoryIndex < Object.keys(tags).length / 2
                        ? 'top-0'
                        : 'bottom-0'
                    )}
                  >
                    {childTags.map((child) => {
                      const childSelected = currentTags.includes(child);
                      return (
                        <button
                          key={child}
                          type="button"
                          onClick={() => toggleChildTag(category, child)}
                          className={cn(
                            'hover:bg-muted flex min-h-8 items-center justify-between rounded-md px-2 py-1 text-left text-sm transition-colors',
                            childSelected && 'bg-secondary font-medium'
                          )}
                          aria-pressed={childSelected}
                          disabled={isSubmitting}
                        >
                          <span data-llm-text={child}>{child}</span>
                          {childSelected && <Check className="size-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </form>
  );
}

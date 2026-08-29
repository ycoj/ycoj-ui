'use client';

import {
  CONTEST_CREATE_RULES,
  CONTEST_PERMISSIONS,
  contestRuleSupportsFlexibleDuration,
  contestRuleSupportsHiddenScoreboard,
  contestRuleSupportsLock,
  type ContestFormValues,
} from '@/features/contest/form/contest-form-utils';
import LanguageAutoComplete from '@/features/language/language-auto-complete';
import ProblemListEditor from '@/features/problem/problem-list-editor';
import AssignSelectAutoComplete from '@/features/user/assign-select-auto-complete';
import UserAutoComplete from '@/features/user/user-auto-complete';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { z } from 'zod';

export type ContestFormMode = 'create' | 'edit';

type Props = {
  mode: ContestFormMode;
  defaultValues: ContestFormValues;
  canAutoHide: boolean;
  domainId: string;
  cancelHref: string;
  onSubmit: (values: ContestFormValues) => Promise<string>;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export default function ContestForm({
  mode,
  defaultValues,
  canAutoHide,
  domainId,
  cancelHref,
  onSubmit,
}: Props) {
  const t = useTranslations(
    mode === 'create' ? 'contestCreate' : 'contestEdit'
  );
  const ruleT = useTranslations('contest.rule');
  const router = useRouter();
  const optionalPositiveNumber = z
    .string()
    .refine((value) => !value.trim() || Number(value) > 0, t('positiveNumber'));
  const schema = z
    .object({
      rule: z.enum(CONTEST_CREATE_RULES),
      title: z.string().trim().min(1, t('titleRequired')).max(64),
      beginAtDate: z.string().regex(datePattern, t('invalidDate')),
      beginAtTime: z.string().regex(timePattern, t('invalidTime')),
      duration: z
        .string()
        .refine((value) => Number(value) > 0, t('durationInvalid')),
      pids: z
        .array(
          z.object({
            docId: z.number(),
            pid: z.string().optional(),
            title: z.string(),
          })
        )
        .min(1, t('problemsInvalid')),
      content: z.string().trim().min(1, t('contentRequired')).max(65535),
      maintainer: z.array(z.string()),
      permission: z.enum(CONTEST_PERMISSIONS),
      assign: z.array(z.string()),
      code: z.string(),
      langs: z.array(z.string()),
      rated: z.boolean(),
      autoHide: z.boolean(),
      allowViewCode: z.boolean(),
      allowPrint: z.boolean(),
      keepScoreboardHidden: z.boolean(),
      lock: optionalPositiveNumber,
      contestDuration: optionalPositiveNumber,
    })
    .refine(
      (values) =>
        !(
          values.rule === 'ioi' &&
          values.lock.trim() &&
          values.contestDuration.trim()
        ),
      { path: ['contestDuration'], message: t('lockConflict') }
    );
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContestFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const [rule, permission] = useWatch({
    control,
    name: ['rule', 'permission'],
  });
  const supportsLock = contestRuleSupportsLock(rule);
  const supportsFlexibleDuration = contestRuleSupportsFlexibleDuration(rule);
  const supportsHiddenScoreboard = contestRuleSupportsHiddenScoreboard(rule);

  const handleFormSubmit = async (values: ContestFormValues) => {
    try {
      const path = await onSubmit({
        ...values,
        autoHide: canAutoHide && values.autoHide,
      });
      router.push(path);
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof Error && error.message
            ? error.message
            : t('submitFailed'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="space-y-6"
      data-llm-visible="true"
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
          <Field>
            <FieldLabel htmlFor="rule">{t('rule')}</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="rule"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="rule"
                      className="w-full"
                      aria-invalid={!!errors.rule}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTEST_CREATE_RULES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ruleT(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.rule]} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="title">{t('contestTitle')}</FieldLabel>
            <FieldContent>
              <Input
                id="title"
                autoFocus
                placeholder={t('titlePlaceholder')}
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              <FieldError errors={[errors.title]} />
            </FieldContent>
          </Field>
        </div>

        <ContestTimingFields
          mode={mode}
          control={control}
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
        />

        <Field>
          <Controller
            control={control}
            name="pids"
            render={({ field }) => (
              <ProblemListEditor
                id="pids"
                domainId={domainId}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                invalid={!!errors.pids}
              />
            )}
          />
          <FieldError errors={[errors.pids]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="content">{t('content')}</FieldLabel>
          <FieldContent>
            <MarkdownEditor
              id="content"
              defaultValue={defaultValues.content}
              disabled={isSubmitting}
              aria-invalid={!!errors.content}
              {...register('content')}
            />
            <FieldError errors={[errors.content]} />
          </FieldContent>
        </Field>
      </div>

      <div
        className={cn(
          'grid gap-4',
          permission === 'public'
            ? 'md:grid-cols-[24rem_12rem]'
            : 'md:grid-cols-[24rem_12rem_minmax(0,1fr)]'
        )}
      >
        <Field className="min-w-0">
          <FieldLabel htmlFor="maintainer">{t('maintainer')}</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="maintainer"
              render={({ field }) => (
                <UserAutoComplete
                  multiple
                  id="maintainer"
                  domainId={domainId}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('maintainerPlaceholder')}
                  ariaLabel={t('maintainer')}
                  disabled={isSubmitting}
                />
              )}
            />
            <FieldDescription>{t('maintainerHelp')}</FieldDescription>
            <FieldError errors={[errors.maintainer]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="permission">{t('permission')}</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="permission"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="permission" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEST_PERMISSIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`permissionOptions.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldContent>
        </Field>
        {permission === 'assign' && (
          <Field className="min-w-0">
            <FieldLabel htmlFor="assign">{t('assign')}</FieldLabel>
            <Controller
              control={control}
              name="assign"
              render={({ field }) => (
                <AssignSelectAutoComplete
                  id="assign"
                  domainId={domainId}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('assignPlaceholder')}
                  ariaLabel={t('assign')}
                  disabled={isSubmitting}
                />
              )}
            />
          </Field>
        )}
        {permission === 'invite' && (
          <Field>
            <FieldLabel htmlFor="code">{t('invitationCode')}</FieldLabel>
            <Input
              id="code"
              placeholder={t('invitationCodePlaceholder')}
              disabled={isSubmitting}
              {...register('code')}
            />
          </Field>
        )}
      </div>

      <div className="space-y-4">
        <div
          className={cn(
            'grid items-start gap-4 sm:grid-cols-2',
            supportsHiddenScoreboard ? 'md:grid-cols-5' : 'md:grid-cols-4'
          )}
        >
          <BooleanField
            control={control}
            name="rated"
            id="rated"
            label={t('rated')}
            description={t('ratedHelp')}
            disabled={isSubmitting}
          />
          <BooleanField
            control={control}
            name="autoHide"
            id="autoHide"
            label={t('autoHide')}
            description={t(
              canAutoHide ? 'autoHideHelp' : 'autoHideUnavailable'
            )}
            checked={canAutoHide ? undefined : false}
            disabled={isSubmitting || !canAutoHide}
          />
          <BooleanField
            control={control}
            name="allowViewCode"
            id="allowViewCode"
            label={t('allowViewCode')}
            description={t('allowViewCodeHelp')}
            disabled={isSubmitting}
          />
          <BooleanField
            control={control}
            name="allowPrint"
            id="allowPrint"
            label={t('allowPrint')}
            description={t('allowPrintHelp')}
            disabled={isSubmitting}
          />
          {supportsHiddenScoreboard && (
            <BooleanField
              control={control}
              name="keepScoreboardHidden"
              id="keepScoreboardHidden"
              label={t('keepScoreboardHidden')}
              description={t('keepScoreboardHiddenHelp')}
              disabled={isSubmitting}
            />
          )}
        </div>

        <div
          className={cn(
            (supportsLock || supportsFlexibleDuration) && 'grid gap-4',
            supportsLock && supportsFlexibleDuration
              ? 'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]'
              : (supportsLock || supportsFlexibleDuration) &&
                  'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'
          )}
        >
          <Field className="min-w-0">
            <FieldLabel htmlFor="langs">{t('languages')}</FieldLabel>
            <FieldContent>
              <Controller
                control={control}
                name="langs"
                render={({ field }) => (
                  <LanguageAutoComplete
                    id="langs"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder={t('languagesPlaceholder')}
                    ariaLabel={t('languages')}
                    disabled={isSubmitting}
                  />
                )}
              />
              <FieldDescription>{t('languagesHelp')}</FieldDescription>
            </FieldContent>
          </Field>
          {supportsLock && (
            <Field>
              <FieldLabel htmlFor="lock">{t('lock')}</FieldLabel>
              <FieldContent>
                <Input
                  id="lock"
                  type="number"
                  min="1"
                  placeholder={t('optional')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.lock}
                  {...register('lock')}
                />
                <FieldDescription>{t('lockHelp')}</FieldDescription>
                <FieldError errors={[errors.lock]} />
              </FieldContent>
            </Field>
          )}
          {supportsFlexibleDuration && (
            <Field>
              <FieldLabel htmlFor="contestDuration">
                {t('flexibleDuration')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="contestDuration"
                  type="number"
                  min="0.01"
                  step="0.25"
                  placeholder={t('optional')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.contestDuration}
                  {...register('contestDuration')}
                />
                <FieldDescription>{t('flexibleDurationHelp')}</FieldDescription>
                <FieldError errors={[errors.contestDuration]} />
              </FieldContent>
            </Field>
          )}
        </div>
      </div>

      <FieldError errors={[errors.root?.serverError]} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? <Plus /> : <Save />}
          {isSubmitting ? t('creating') : t('create')}
        </Button>
        <Button asChild variant="secondary">
          <Link href={cancelHref}>
            <ArrowLeft />
            {t('cancel')}
          </Link>
        </Button>
      </div>
    </form>
  );
}

type ContestTimingFieldsProps = {
  mode: ContestFormMode;
  control: Control<ContestFormValues>;
  register: UseFormRegister<ContestFormValues>;
  errors: FieldErrors<ContestFormValues>;
  isSubmitting: boolean;
};

function ContestTimingFields({
  mode,
  control,
  register,
  errors,
  isSubmitting,
}: ContestTimingFieldsProps) {
  const t = useTranslations(
    mode === 'create' ? 'contestCreate' : 'contestEdit'
  );
  const [beginAtDate, beginAtTime, duration] = useWatch({
    control,
    name: ['beginAtDate', 'beginAtTime', 'duration'],
  });
  const parsedDuration = Number(duration);
  const endAt =
    beginAtDate && beginAtTime && Number.isFinite(parsedDuration)
      ? dayjs(`${beginAtDate}T${beginAtTime}`)
          .add(parsedDuration, 'hour')
          .format('YYYY-MM-DD HH:mm')
      : '';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field>
        <FieldLabel htmlFor="beginAtDate">{t('beginDate')}</FieldLabel>
        <FieldContent>
          <Input
            id="beginAtDate"
            type="date"
            disabled={isSubmitting}
            aria-invalid={!!errors.beginAtDate}
            {...register('beginAtDate')}
          />
          <FieldError errors={[errors.beginAtDate]} />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel htmlFor="beginAtTime">{t('beginTime')}</FieldLabel>
        <FieldContent>
          <Input
            id="beginAtTime"
            type="time"
            disabled={isSubmitting}
            aria-invalid={!!errors.beginAtTime}
            {...register('beginAtTime')}
          />
          <FieldError errors={[errors.beginAtTime]} />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel htmlFor="duration">{t('duration')}</FieldLabel>
        <FieldContent>
          <Input
            id="duration"
            type="number"
            min="0.01"
            step="0.25"
            disabled={isSubmitting}
            aria-invalid={!!errors.duration}
            {...register('duration')}
          />
          <FieldError errors={[errors.duration]} />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel htmlFor="endAt">{t('endTime')}</FieldLabel>
        <Input id="endAt" value={endAt} disabled readOnly />
      </Field>
    </div>
  );
}

type BooleanFieldName = Extract<
  keyof ContestFormValues,
  'rated' | 'autoHide' | 'allowViewCode' | 'allowPrint' | 'keepScoreboardHidden'
>;

type BooleanFieldProps = {
  control: Control<ContestFormValues>;
  name: BooleanFieldName;
  id: string;
  label: string;
  description: string;
  checked?: boolean;
  disabled?: boolean;
};

function BooleanField({
  control,
  name,
  id,
  label,
  description,
  checked,
  disabled,
}: BooleanFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex min-w-0 items-start gap-2">
          <Checkbox
            id={id}
            checked={checked ?? field.value}
            onCheckedChange={(value) => field.onChange(value === true)}
            disabled={disabled}
            className="mt-0.5"
          />
          <Label
            htmlFor={id}
            className="flex min-w-0 flex-col items-start gap-0.5"
          >
            <span>{label}</span>
            <span className="text-muted-foreground text-xs font-normal">
              {description}
            </span>
          </Label>
        </div>
      )}
    />
  );
}

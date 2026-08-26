'use client';

import QuestionContext, {
  useQuestionContext,
} from '@/features/problem/objective/objective-question-context';
import { useObjective } from '@/features/problem/objective/provider';
import type { ObjectiveControlType } from '@/features/problem/objective/question-schema';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { Children, isValidElement, useEffect, useId } from 'react';

function getId(props: Record<string, unknown>): string {
  return (props['data-id'] as string) ?? (props['dataId'] as string) ?? '';
}

function getOptionsKey(props: Record<string, unknown>): string {
  const raw =
    (props['data-options'] as string) ?? (props['dataOptions'] as string);
  return typeof raw === 'string' ? raw : '';
}

function parseOptionsKey(optionsKey: string): string[] {
  if (!optionsKey) return [];
  try {
    const parsed = JSON.parse(optionsKey);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
  } catch {
    return [];
  }
  return [];
}

function getChildOptionsKey(children: React.ReactNode): string {
  const values = Children.toArray(children)
    .map((child) => {
      if (!isValidElement(child)) return null;
      const childProps = child.props as Record<string, unknown>;
      const value =
        (childProps['data-value'] as string) ??
        (childProps['dataValue'] as string);
      return typeof value === 'string' && value ? value : null;
    })
    .filter((v): v is string => v !== null);
  return values.length > 0 ? JSON.stringify(values) : '';
}

function useRegisterQuestion(
  id: string,
  type: ObjectiveControlType,
  optionsKey: string
) {
  const { registerQuestion } = useObjective();
  useEffect(() => {
    if (!id) return;
    const options = parseOptionsKey(optionsKey);
    return registerQuestion({
      id,
      type,
      ...(options.length > 0 ? { options } : {}),
    });
  }, [id, type, optionsKey, registerQuestion]);
}

function useObjectiveTextField(
  props: Record<string, unknown>,
  type: 'input' | 'textarea'
) {
  const id = getId(props);
  const { answers, setAnswer, isReady, isReadOnly } = useObjective();
  const uid = useId();
  const t = useTranslations('problem.objectiveForm');
  useRegisterQuestion(id, type, '');
  const value = typeof answers[id] === 'string' ? (answers[id] as string) : '';
  return { id, value, setAnswer, isReady, isReadOnly, uid, t };
}

export function ObjectiveInput(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  const { id, value, setAnswer, isReady, isReadOnly, uid, t } =
    useObjectiveTextField(props, 'input');
  if (!id) return null;
  return (
    <span
      data-objective-id={id}
      data-objective-type="input"
      className="inline-flex w-full max-w-64 align-middle"
      id={`objective-${id}`}
    >
      <Input
        id={`${uid}-${id}`}
        value={value}
        onChange={(e) => setAnswer(id, e.target.value)}
        disabled={!isReady || isReadOnly}
        placeholder={t('answerFor', { id })}
        aria-label={t('answerFor', { id })}
        className="h-8"
      />
    </span>
  );
}

export function ObjectiveTextarea(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  const { id, value, setAnswer, isReady, isReadOnly, uid, t } =
    useObjectiveTextField(props, 'textarea');
  if (!id) return null;
  return (
    <span
      data-objective-id={id}
      data-objective-type="textarea"
      className="flex w-full max-w-xl"
      id={`objective-${id}`}
    >
      <Textarea
        id={`${uid}-${id}`}
        value={value}
        onChange={(e) => setAnswer(id, e.target.value)}
        disabled={!isReady || isReadOnly}
        placeholder={t('answerFor', { id })}
        aria-label={t('answerFor', { id })}
        className="min-h-20"
      />
    </span>
  );
}

export function ObjectiveDropdown(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  const id = getId(props);
  const t = useTranslations('problem.objectiveForm');
  const { answers, setAnswer, isReady, isReadOnly } = useObjective();
  const optionsKey = getOptionsKey(props);
  useRegisterQuestion(id, 'dropdown', optionsKey);
  if (!id) return null;
  const options = parseOptionsKey(optionsKey);
  const value = typeof answers[id] === 'string' ? (answers[id] as string) : '';

  return (
    <span
      data-objective-id={id}
      data-objective-type="dropdown"
      className="inline-flex w-full max-w-64 align-middle"
      id={`objective-${id}`}
    >
      <Select
        value={value}
        onValueChange={(v) => setAnswer(id, v)}
        disabled={!isReady || isReadOnly}
      >
        <SelectTrigger aria-label={t('answerFor', { id })} className="w-full">
          <SelectValue placeholder={t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

type ChoiceType = 'select' | 'multiselect';

function ObjectiveChoiceGroup(
  props: Record<string, unknown> & {
    children?: React.ReactNode;
    type: ChoiceType;
  }
) {
  const id = getId(props);
  const t = useTranslations('problem.objectiveForm');
  const { isReady, isReadOnly } = useObjective();
  const { type } = props;
  useRegisterQuestion(id, type, getChildOptionsKey(props.children));
  if (!id) return null;
  return (
    <QuestionContext.Provider value={{ id, type }}>
      <fieldset
        data-objective-id={id}
        data-objective-type={type}
        id={`objective-${id}`}
        disabled={!isReady || isReadOnly}
        className="my-2 space-y-2"
        aria-label={t('answerFor', { id })}
      >
        <div className="space-y-2">{props.children}</div>
      </fieldset>
    </QuestionContext.Provider>
  );
}

export function ObjectiveSelect(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  return <ObjectiveChoiceGroup {...props} type="select" />;
}

export function ObjectiveMultiselect(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  return <ObjectiveChoiceGroup {...props} type="multiselect" />;
}

export function ObjectiveOption(
  props: Record<string, unknown> & { children?: React.ReactNode }
) {
  const ctx = useQuestionContext();
  const value =
    (props['data-value'] as string) ?? (props['dataValue'] as string) ?? '';
  const { answers, setAnswer, isReady, isReadOnly } = useObjective();
  const id = ctx?.id;
  const type = ctx?.type;
  const uid = useId();

  if (!id || !value) return null;

  const current = answers[id];
  const isChecked =
    type === 'select'
      ? current === value
      : Array.isArray(current)
        ? (current as string[]).includes(value)
        : false;

  const handleChange = (checked: boolean) => {
    if (type === 'select') {
      if (checked) setAnswer(id, value);
    } else {
      const arr = Array.isArray(current) ? [...(current as string[])] : [];
      if (checked) {
        if (!arr.includes(value)) {
          arr.push(value);
          arr.sort((a, b) => a.localeCompare(b));
        }
      } else {
        const idx = arr.indexOf(value);
        if (idx !== -1) arr.splice(idx, 1);
      }
      setAnswer(id, arr);
    }
  };

  return (
    <label
      htmlFor={`${uid}-${id}-${value}`}
      data-objective-id={id}
      data-objective-value={value}
      className={cn(
        'flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 has-[input:checked]:border-primary has-[input:checked]:bg-accent cursor-pointer',
        (!isReady || isReadOnly) && 'opacity-60 cursor-not-allowed'
      )}
    >
      {type === 'select' ? (
        <input
          id={`${uid}-${id}-${value}`}
          type="radio"
          name={`objective-${id}`}
          value={value}
          checked={isChecked}
          onChange={(e) => handleChange(e.target.checked)}
          disabled={!isReady || isReadOnly}
          className="size-4 shrink-0 accent-primary"
        />
      ) : (
        <Checkbox
          id={`${uid}-${id}-${value}`}
          checked={isChecked}
          onCheckedChange={(c) => handleChange(c === true)}
          disabled={!isReady || isReadOnly}
          className="shrink-0"
        />
      )}
      <span className="flex-1 text-sm">
        <span className="mr-2 font-medium">{value}.</span>
        <span>{props.children}</span>
      </span>
    </label>
  );
}

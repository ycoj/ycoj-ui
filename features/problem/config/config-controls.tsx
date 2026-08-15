'use client';

import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { CompilableSource } from '@/shared/types/problem-config';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useId } from 'react';

export function ConfigField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
      <div className="pt-1">
        <Label data-llm-text={label}>{label}</Label>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? 'default' : 'ghost'}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function MultiSelect({
  label,
  values,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  const selected = new Set(values);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-8 w-full justify-between whitespace-normal"
          aria-label={label}
        >
          <span className="min-w-0 truncate text-left">
            {values.length
              ? options
                  .filter((option) => selected.has(option.value))
                  .map((option) => option.label)
                  .join(', ')
              : placeholder}
          </span>
          <ChevronsUpDown className="shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="start"
          className="z-50 max-h-72 w-[min(24rem,var(--radix-popover-trigger-width))] overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.length ? (
            options.map((option) => {
              const checked = selected.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() =>
                    onChange(
                      checked
                        ? values.filter((value) => value !== option.value)
                        : [...values, option.value]
                    )
                  }
                >
                  <span className="flex size-4 items-center justify-center rounded-sm border">
                    {checked ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              {placeholder}
            </p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function SourceField({
  value,
  files,
  languageOptions,
  fileLabel,
  languageLabel,
  noneLabel,
  onChange,
}: {
  value?: CompilableSource;
  files: string[];
  languageOptions: string[];
  fileLabel: string;
  languageLabel: string;
  noneLabel: string;
  onChange: (value?: CompilableSource) => void;
}) {
  const file = typeof value === 'string' ? value : value?.file;
  const lang = typeof value === 'object' ? value.lang : '';
  const languageId = useId();
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Select
        value={file ?? '__none'}
        onValueChange={(next) => {
          if (next === '__none') onChange(undefined);
          else onChange(lang ? { file: next, lang } : next);
        }}
      >
        <SelectTrigger className="w-full" aria-label={fileLabel}>
          <SelectValue placeholder={fileLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">{noneLabel}</SelectItem>
          {files.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {file ? (
        <div className="relative">
          <Label htmlFor={languageId} className="sr-only">
            {languageLabel}
          </Label>
          <Input
            id={languageId}
            list={`${languageId}-options`}
            value={lang}
            placeholder={languageLabel}
            onChange={(event) =>
              onChange(
                event.target.value ? { file, lang: event.target.value } : file
              )
            }
          />
          <datalist id={`${languageId}-options`}>
            {languageOptions.map((language) => (
              <option key={language} value={language} />
            ))}
          </datalist>
          {lang ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              aria-label={noneLabel}
              onClick={() => onChange(file)}
            >
              <X />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ConfigCheckbox({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2 py-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

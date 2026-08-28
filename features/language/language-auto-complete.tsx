'use client';

import ClientApis from '@/api/client/method';
import {
  filterLanguages,
  flattenLanguages,
  languageLabel,
  resolveLanguageOptions,
  type LanguageOption,
} from '@/features/language/language-auto-complete-utils';
import { cn } from '@/shared/lib/utils';
import { Combobox } from '@base-ui/react/combobox';
import { Check, LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

type LoadStatus = 'loading' | 'success' | 'failed';

type Props = {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  onBlur?: () => void;
};

const uniqueItemsById = (items: LanguageOption[]) => [
  ...new Map(items.map((item) => [item.id, item])).values(),
];

const optionLabel = (option: LanguageOption) =>
  option.invalid ? option.id : languageLabel(option);

export default function LanguageAutoComplete({
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  disabled,
  className,
  inputClassName,
  id,
  onBlur,
}: Props) {
  const t = useTranslations('autoComplete');
  const [options, setOptions] = useState<LanguageOption[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void ClientApis.UI.getAvailableLanguages()
      .send()
      .then((response) => {
        if (cancelled) return;
        setOptions(flattenLanguages(response.languages));
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setOptions([]);
        setStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedItems = useMemo(() => {
    if (!value.length) return [];
    if (status === 'success') return resolveLanguageOptions(options, value);
    return value.map((itemId) => ({
      id: itemId,
      family: itemId,
      familyDisplay: itemId,
      display: itemId,
    }));
  }, [options, status, value]);

  const filteredOptions = useMemo(
    () => filterLanguages(options, query),
    [options, query]
  );
  const items = useMemo(() => {
    const merged = [...filteredOptions];
    for (const selectedItem of selectedItems) {
      if (!merged.some((item) => item.id === selectedItem.id)) {
        merged.push(selectedItem);
      }
    }
    return merged;
  }, [filteredOptions, selectedItems]);
  const loading = status === 'loading';
  const failed = status === 'failed';
  const noResults = status === 'success' && filteredOptions.length === 0;

  return (
    <Combobox.Root<LanguageOption, true>
      items={items}
      value={selectedItems}
      inputValue={query}
      onValueChange={(nextItems) => {
        const uniqueItems = uniqueItemsById(nextItems);
        setQuery('');
        onValueChange(uniqueItems.map((item) => item.id));
      }}
      onInputValueChange={(nextQuery, details) => {
        if (details.reason === 'item-press') return;
        setQuery(nextQuery);
        setOpen(true);
      }}
      onOpenChange={setOpen}
      open={open}
      itemToStringLabel={optionLabel}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
      filter={null}
      autoHighlight
      multiple
      disabled={disabled}
    >
      <Combobox.Chips
        className={cn(
          'border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-0.5 rounded-lg border bg-transparent px-1.5 py-0.5 text-sm transition-colors focus-within:ring-3',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        data-llm-visible="true"
      >
        <Combobox.Value>
          {(nextSelectedItems: LanguageOption[]) => (
            <>
              {nextSelectedItems.map((item) => {
                const label = optionLabel(item);
                return (
                  <Combobox.Chip
                    key={item.id}
                    className="bg-secondary text-secondary-foreground inline-flex max-w-full items-center gap-0.5 rounded-md px-1.5 py-0 text-xs font-medium"
                    aria-label={label}
                    data-llm-text={label}
                  >
                    <span className="truncate">
                      {label}
                      {item.invalid ? ` (${t('invalid')})` : ''}
                    </span>
                    <Combobox.ChipRemove
                      className="hover:bg-muted inline-flex size-4 shrink-0 items-center justify-center rounded-sm outline-none"
                      aria-label={t('remove', { name: label })}
                    >
                      <X className="size-3" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                );
              })}
              <Combobox.Input
                id={id}
                placeholder={nextSelectedItems.length ? undefined : placeholder}
                aria-label={ariaLabel ?? placeholder}
                autoComplete="off"
                spellCheck={false}
                onBlur={onBlur}
                onMouseDown={() => {
                  if (!disabled) setOpen(true);
                }}
                className={cn(
                  'placeholder:text-muted-foreground h-6 min-w-32 flex-1 bg-transparent py-0 outline-none disabled:cursor-not-allowed',
                  inputClassName
                )}
              />
            </>
          )}
        </Combobox.Value>
      </Combobox.Chips>

      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Combobox.Popup
            className="bg-popover text-popover-foreground ring-foreground/10 w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-lg shadow-md ring-1 transition-[transform,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0"
            aria-busy={loading || undefined}
            data-llm-visible="true"
          >
            {(loading || failed || noResults) && (
              <Combobox.Status>
                <div
                  className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm"
                  data-llm-text={
                    loading
                      ? t('loading')
                      : failed
                        ? t('loadFailed')
                        : t('noResults')
                  }
                >
                  {loading && <LoaderCircle className="size-4 animate-spin" />}
                  {loading
                    ? t('loading')
                    : failed
                      ? t('loadFailed')
                      : t('noResults')}
                </div>
              </Combobox.Status>
            )}
            <Combobox.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0">
              {(item: LanguageOption, index: number) => (
                <Combobox.Item
                  key={item.id}
                  value={item}
                  index={index}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-accent/60 flex cursor-default items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate font-medium"
                      data-llm-text={optionLabel(item)}
                    >
                      {optionLabel(item)}
                    </div>
                    <div
                      className="text-muted-foreground text-xs"
                      data-llm-text={item.invalid ? t('invalid') : item.id}
                    >
                      {item.invalid ? t('invalid') : item.id}
                    </div>
                  </div>
                  <Combobox.ItemIndicator className="ml-auto shrink-0">
                    <Check className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

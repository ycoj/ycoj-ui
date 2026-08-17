'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { Combobox } from '@base-ui/react/combobox';
import { LoaderCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

export type AsyncAutoCompleteMessages = {
  clear: string;
  loadFailed: string;
  loading: string;
  noResults: string;
};

export type AsyncAutoCompleteProps<Item> = {
  value: string;
  onValueChange: (value: string) => void;
  searchItems: (query: string) => Promise<Item[]>;
  resolveItem?: (value: string) => Promise<Item | null>;
  itemKey: (item: Item) => string;
  itemLabel: (item: Item) => string;
  itemInputLabel?: (item: Item) => string;
  renderItem: (item: Item) => ReactNode;
  messages: AsyncAutoCompleteMessages;
  allowEmptyQuery?: boolean;
  debounceMs?: number;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onBlur?: () => void;
};

type SearchState<Item> = {
  query: string;
  status: 'loading' | 'success' | 'failed';
  items: Item[];
};

export default function AsyncAutoComplete<Item>({
  value,
  onValueChange,
  searchItems,
  resolveItem,
  itemKey,
  itemLabel,
  itemInputLabel,
  renderItem,
  messages,
  allowEmptyQuery = false,
  debounceMs = 300,
  placeholder,
  ariaLabel,
  disabled,
  className,
  inputClassName,
  onBlur,
}: AsyncAutoCompleteProps<Item>) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchState, setSearchState] = useState<SearchState<Item> | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [editingSelection, setEditingSelection] = useState(false);
  const requestId = useRef(0);
  const resolveRequestId = useRef(0);
  const selectedValue =
    selectedItem && itemKey(selectedItem) === value ? selectedItem : null;
  const inputValue = selectedValue
    ? editingSelection && itemInputLabel
      ? itemInputLabel(selectedValue)
      : itemLabel(selectedValue)
    : value;
  const query = inputValue.trim();
  const shouldSearch = open && (allowEmptyQuery || query.length > 0);

  useEffect(() => {
    const currentRequestId = ++resolveRequestId.current;

    if (!resolveItem || !value || selectedValue || open) return;

    void resolveItem(value)
      .then((item) => {
        if (
          resolveRequestId.current !== currentRequestId ||
          !item ||
          itemKey(item) !== value
        ) {
          return;
        }

        setSelectedItem(item);
      })
      .catch(() => {
        // Resolution is best-effort; free-form input remains supported.
      });
  }, [itemKey, open, resolveItem, selectedValue, value]);

  useEffect(() => {
    const currentRequestId = ++requestId.current;

    if (!shouldSearch) return;

    const timeout = window.setTimeout(() => {
      if (requestId.current !== currentRequestId) return;
      setSearchState({ query, status: 'loading', items: [] });

      void searchItems(query)
        .then((nextItems) => {
          if (requestId.current !== currentRequestId) return;
          setSearchState({ query, status: 'success', items: nextItems });
        })
        .catch(() => {
          if (requestId.current !== currentRequestId) return;
          setSearchState({ query, status: 'failed', items: [] });
        });
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [debounceMs, query, searchItems, shouldSearch]);

  const currentSearchState = searchState?.query === query ? searchState : null;
  const items = useMemo(
    () => currentSearchState?.items ?? [],
    [currentSearchState]
  );
  const loading =
    shouldSearch &&
    (!currentSearchState || currentSearchState.status === 'loading');
  const failed = shouldSearch && currentSearchState?.status === 'failed';

  const availableItems = useMemo(() => {
    if (
      !selectedValue ||
      items.some((item) => itemKey(item) === itemKey(selectedValue))
    ) {
      return items;
    }
    return [...items, selectedValue];
  }, [itemKey, items, selectedValue]);

  const handleInputValueChange = (
    nextValue: string,
    details: Combobox.Root.ChangeEventDetails
  ) => {
    if (details.reason === 'item-press') return;

    setSelectedItem(null);
    setEditingSelection(false);
    setSearchState(null);
    onValueChange(nextValue);
    if (nextValue.trim() || allowEmptyQuery) setOpen(true);
    else setOpen(false);
  };

  const handleSelectedValueChange = (nextItem: Item | null) => {
    if (!nextItem) {
      setSelectedItem(null);
      setEditingSelection(false);
      setSearchState(null);
      onValueChange('');
      if (!allowEmptyQuery) setOpen(false);
      return;
    }

    setSelectedItem(nextItem);
    setEditingSelection(false);
    onValueChange(itemKey(nextItem));
  };

  const showNoResults =
    shouldSearch &&
    currentSearchState?.status === 'success' &&
    items.length === 0;

  return (
    <Combobox.Root
      items={availableItems}
      value={selectedValue}
      inputValue={inputValue}
      onValueChange={handleSelectedValueChange}
      onInputValueChange={handleInputValueChange}
      onOpenChange={(nextOpen) => {
        const canOpen =
          nextOpen && (allowEmptyQuery || inputValue.trim().length > 0);
        setOpen(canOpen);
        setEditingSelection(
          Boolean(canOpen && selectedValue && itemInputLabel)
        );
        if (canOpen) setSearchState(null);
      }}
      open={open}
      itemToStringLabel={itemLabel}
      itemToStringValue={itemKey}
      isItemEqualToValue={(item, selected) =>
        itemKey(item) === itemKey(selected)
      }
      filter={null}
      autoHighlight
      disabled={disabled}
    >
      <div className={cn('relative', className)}>
        <Combobox.Input
          render={<Input />}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          autoComplete="off"
          spellCheck={false}
          onBlur={onBlur}
          className={cn('pr-8', inputClassName)}
        />
        {inputValue && !disabled && (
          <Combobox.Clear
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-1 -translate-y-1/2"
              />
            }
            aria-label={messages.clear}
            title={messages.clear}
          >
            <X />
          </Combobox.Clear>
        )}
      </div>

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
            {(loading || failed || showNoResults) && (
              <Combobox.Status>
                <div
                  className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm"
                  data-llm-text={
                    loading
                      ? messages.loading
                      : failed
                        ? messages.loadFailed
                        : messages.noResults
                  }
                >
                  {loading && <LoaderCircle className="size-4 animate-spin" />}
                  {loading
                    ? messages.loading
                    : failed
                      ? messages.loadFailed
                      : messages.noResults}
                </div>
              </Combobox.Status>
            )}
            <Combobox.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0">
              {(item: Item, index: number) => (
                <Combobox.Item
                  key={itemKey(item)}
                  value={item}
                  index={index}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-accent/60 cursor-default rounded-md px-2 py-2 text-sm outline-none select-none"
                >
                  {renderItem(item)}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

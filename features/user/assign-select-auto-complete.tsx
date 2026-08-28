'use client';

import ClientApis from '@/api/client/method';
import type { UserGroupAutoCompleteItem } from '@/api/client/method/domain/groups';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { Combobox } from '@base-ui/react/combobox';
import { Check, LoaderCircle, UsersRound, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AssignItem = {
  type: 'user' | 'group';
  key: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  uids?: number[];
  invalid?: boolean;
};

type Props = {
  domainId: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  onBlur?: () => void;
  id?: string;
};

type SearchState = {
  query: string;
  status: 'loading' | 'success' | 'failed';
  items: AssignItem[];
};

const isUserKey = (key: string) => /^-?\d+$/.test(key);

const toUserItem = (user: UserAutoCompleteItem): AssignItem => ({
  type: 'user',
  key: String(user._id),
  name: user.uname,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
});

const toGroupItem = (group: UserGroupAutoCompleteItem): AssignItem => ({
  type: 'group',
  key: group.name,
  name: group.name,
  uids: group.uids,
});

const itemLabel = (item: AssignItem) =>
  item.type === 'user' && item.displayName
    ? `${item.name} (${item.displayName})`
    : item.name;

const itemKeysEqual = (items: AssignItem[], keys: string[]) =>
  items.length === keys.length &&
  items.every((item, index) => item.key === keys[index]);

export default function AssignSelectAutoComplete({
  domainId,
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  disabled,
  onBlur,
  id,
}: Props) {
  const t = useTranslations('autoComplete');
  const [selectedItems, setSelectedItems] = useState<AssignItem[]>([]);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selectedItemsRef = useRef<AssignItem[]>([]);
  const resolvedDomainRef = useRef('');
  const searchRequestId = useRef(0);
  const resolveRequestId = useRef(0);
  const valueSignature = JSON.stringify(value);
  const trimmedQuery = query.trim();

  const resolveItems = useCallback(
    async (keys: string[]) => {
      const userIds = keys.filter(isUserKey);
      const groupNames = keys.filter((key) => !isUserKey(key));
      const [users, groups] = await Promise.all([
        userIds.length
          ? ClientApis.User.getUsersByIds(domainId, userIds).send()
          : Promise.resolve([]),
        groupNames.length
          ? ClientApis.Domain.getGroupsByNames(domainId, groupNames).send()
          : Promise.resolve([]),
      ]);
      const usersById = new Map(
        users.map((user) => [String(user._id), toUserItem(user)])
      );
      const groupsByName = new Map(
        groups.map((group) => [group.name, toGroupItem(group)])
      );

      return keys.map<AssignItem>((key) => {
        if (isUserKey(key)) {
          return (
            usersById.get(key) ?? {
              type: 'user',
              key,
              name: key,
              invalid: true,
            }
          );
        }
        return (
          groupsByName.get(key) ?? {
            type: 'group',
            key,
            name: key,
            invalid: true,
          }
        );
      });
    },
    [domainId]
  );

  useEffect(() => {
    const keys = JSON.parse(valueSignature) as string[];
    if (
      resolvedDomainRef.current === domainId &&
      itemKeysEqual(selectedItemsRef.current, keys)
    ) {
      return;
    }

    const currentRequestId = ++resolveRequestId.current;
    if (!keys.length) {
      selectedItemsRef.current = [];
      resolvedDomainRef.current = domainId;
      void Promise.resolve().then(() => {
        if (resolveRequestId.current === currentRequestId) {
          setSelectedItems([]);
        }
      });
      return;
    }

    void resolveItems(keys)
      .then((items) => {
        if (resolveRequestId.current !== currentRequestId) return;
        selectedItemsRef.current = items;
        resolvedDomainRef.current = domainId;
        setSelectedItems(items);
      })
      .catch(() => {
        if (resolveRequestId.current !== currentRequestId) return;
        const items = keys.map<AssignItem>((key) => ({
          type: isUserKey(key) ? 'user' : 'group',
          key,
          name: key,
          invalid: true,
        }));
        selectedItemsRef.current = items;
        resolvedDomainRef.current = domainId;
        setSelectedItems(items);
      });
  }, [domainId, resolveItems, valueSignature]);

  useEffect(() => {
    const currentRequestId = ++searchRequestId.current;
    if (!trimmedQuery) return;

    const timeout = window.setTimeout(() => {
      if (searchRequestId.current !== currentRequestId) return;
      setSearchState({
        query: trimmedQuery,
        status: 'loading',
        items: [],
      });

      void Promise.all([
        ClientApis.Domain.searchGroups(domainId, trimmedQuery).send(),
        ClientApis.User.searchUsers(domainId, trimmedQuery).send(),
      ])
        .then(([groups, users]) => {
          if (searchRequestId.current !== currentRequestId) return;
          setSearchState({
            query: trimmedQuery,
            status: 'success',
            items: [...groups.map(toGroupItem), ...users.map(toUserItem)],
          });
        })
        .catch(() => {
          if (searchRequestId.current !== currentRequestId) return;
          setSearchState({
            query: trimmedQuery,
            status: 'failed',
            items: [],
          });
        });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [domainId, trimmedQuery]);

  const currentSearchState =
    searchState?.query === trimmedQuery ? searchState : null;
  const searchItems = useMemo(
    () => currentSearchState?.items ?? [],
    [currentSearchState]
  );
  const items = useMemo(() => {
    const merged = [...searchItems];
    for (const selectedItem of selectedItems) {
      if (!merged.some((item) => item.key === selectedItem.key)) {
        merged.push(selectedItem);
      }
    }
    return merged;
  }, [searchItems, selectedItems]);
  const loading =
    Boolean(trimmedQuery) &&
    (!currentSearchState || currentSearchState.status === 'loading');
  const failed =
    Boolean(trimmedQuery) && currentSearchState?.status === 'failed';
  const noResults =
    Boolean(trimmedQuery) &&
    currentSearchState?.status === 'success' &&
    searchItems.length === 0;

  return (
    <Combobox.Root<AssignItem, true>
      items={items}
      value={selectedItems}
      inputValue={query}
      onValueChange={(nextItems) => {
        selectedItemsRef.current = nextItems;
        resolvedDomainRef.current = domainId;
        setSelectedItems(nextItems);
        setQuery('');
        setSearchState(null);
        setOpen(false);
        onValueChange(nextItems.map((item) => item.key));
      }}
      onInputValueChange={(nextQuery, details) => {
        if (details.reason === 'item-press') return;
        setQuery(nextQuery);
        setSearchState(null);
        setOpen(Boolean(nextQuery.trim()));
      }}
      onOpenChange={(nextOpen) => setOpen(Boolean(nextOpen && trimmedQuery))}
      open={open}
      itemToStringLabel={itemLabel}
      itemToStringValue={(item) => item.key}
      isItemEqualToValue={(item, selected) => item.key === selected.key}
      filter={null}
      autoHighlight
      multiple
      disabled={disabled}
    >
      <Combobox.Chips
        className={cn(
          'border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex min-h-8 w-full flex-wrap items-center gap-0.5 rounded-lg border bg-transparent px-1.5 py-0.5 text-sm transition-colors focus-within:ring-3',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        data-llm-visible="true"
      >
        <Combobox.Value>
          {(nextSelectedItems: AssignItem[]) => (
            <>
              {nextSelectedItems.map((item) => {
                const label = itemLabel(item);
                return (
                  <Combobox.Chip
                    key={item.key}
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
                className="placeholder:text-muted-foreground h-6 min-w-32 flex-1 bg-transparent py-0 outline-none disabled:cursor-not-allowed"
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
              {(item: AssignItem, index: number) => (
                <Combobox.Item
                  key={item.key}
                  value={item}
                  index={index}
                  className="data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-accent/60 flex cursor-default items-center gap-2.5 rounded-md px-2 py-2 text-sm outline-none select-none"
                >
                  {item.type === 'group' ? (
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                      <UsersRound className="size-4" />
                    </div>
                  ) : (
                    <Avatar size="sm">
                      <AvatarImage src={item.avatarUrl} alt="" />
                      <AvatarFallback>
                        {item.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate font-medium"
                      data-llm-text={itemLabel(item)}
                    >
                      {itemLabel(item)}
                    </div>
                    <div
                      className="text-muted-foreground text-xs"
                      data-llm-text={
                        item.invalid
                          ? t('invalid')
                          : item.type === 'group'
                            ? t('groupUsers', {
                                count: item.uids?.length ?? 0,
                              })
                            : `${t('user')} · ${t('userId', { id: item.key })}`
                      }
                    >
                      {item.invalid
                        ? t('invalid')
                        : item.type === 'group'
                          ? `${t('group')} · ${t('groupUsers', {
                              count: item.uids?.length ?? 0,
                            })}`
                          : `${t('user')} · ${t('userId', { id: item.key })}`}
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

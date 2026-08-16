'use client';

import ClientApis from '@/api/client/method';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import AsyncAutoComplete from '@/shared/components/async-auto-complete';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

type Props = {
  domainId: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onBlur?: () => void;
};

const userKey = (user: UserAutoCompleteItem) =>
  /^[+-]?\d+$/.test(user.uname.trim()) ? String(user._id) : user.uname;

const userLabel = (user: UserAutoCompleteItem) =>
  user.uname + (user.displayName ? ` (${user.displayName})` : '');

export default function UserAutoComplete({ domainId, ...props }: Props) {
  const t = useTranslations('autoComplete');
  const searchItems = useCallback(
    async (query: string) =>
      await ClientApis.User.searchUsers(domainId, query).send(),
    [domainId]
  );

  return (
    <AsyncAutoComplete<UserAutoCompleteItem>
      {...props}
      searchItems={searchItems}
      itemKey={userKey}
      itemLabel={userLabel}
      renderItem={(user) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback>
              {user.uname.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div
              className="truncate font-medium"
              data-llm-text={userLabel(user)}
            >
              {userLabel(user)}
            </div>
            <div
              className="text-muted-foreground text-xs"
              data-llm-text={t('userId', { id: user._id })}
            >
              {t('userId', { id: user._id })}
            </div>
          </div>
        </div>
      )}
      messages={{
        clear: t('clear'),
        loadFailed: t('loadFailed'),
        loading: t('loading'),
        noResults: t('noResults'),
      }}
    />
  );
}

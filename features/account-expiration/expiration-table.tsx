'use client';

import { expirationStatus } from './expiration-utils';
import UserSpan from '@/features/user/user-span';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { AccountExpirationUser } from '@/shared/types/account-expiration';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  users: AccountExpirationUser[];
  selected: number[];
  disabled: boolean;
  onToggle: (index: number, range: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (user: AccountExpirationUser) => void;
};

export default function ExpirationTable({
  users,
  selected,
  disabled,
  onToggle,
  onSelectAll,
  onEdit,
}: Props) {
  const t = useTranslations('accountExpiration');
  const selectable = users.filter((user) => !user.accountExpirationProtected);
  if (!users.length)
    return (
      <Empty className="min-h-48 border">
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('empty')}>{t('empty')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  return (
    <div className="rounded-lg border" data-llm-visible="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                aria-label={t('selectAll')}
                disabled={disabled || !selectable.length}
                checked={
                  selected.length === 0
                    ? false
                    : selected.length === selectable.length
                      ? true
                      : 'indeterminate'
                }
                onCheckedChange={(checked) => onSelectAll(checked === true)}
              />
            </TableHead>
            {(
              [
                'uid',
                'user',
                'email',
                'date',
                'statusLabel',
                'actions',
              ] as const
            ).map((key) => (
              <TableHead key={key}>{t(key)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const status = expirationStatus(user);
            return (
              <TableRow key={user._id}>
                <TableCell>
                  <Checkbox
                    aria-label={t('selectUser', { name: user.uname })}
                    checked={selected.includes(user._id)}
                    disabled={disabled || user.accountExpirationProtected}
                    onClick={(event) => {
                      event.preventDefault();
                      onToggle(index, event.shiftKey);
                    }}
                  />
                </TableCell>
                <TableCell data-llm-text={String(user._id)}>
                  {user._id}
                </TableCell>
                <TableCell>
                  <UserSpan user={user} />
                </TableCell>
                <TableCell data-llm-text={user.mail}>{user.mail}</TableCell>
                <TableCell data-llm-text={user.accountExpireDate || t('never')}>
                  {user.accountExpireDate || t('never')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      status === 'autoExpired' || status === 'banned'
                        ? 'destructive'
                        : 'secondary'
                    }
                    data-llm-text={t(`status.${status}`)}
                  >
                    {t(`status.${status}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {!user.accountExpirationProtected && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onEdit(user)}
                      aria-label={t('editUser', { name: user.uname })}
                    >
                      <Pencil aria-hidden="true" />
                      {t('edit')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import ExpirationActionDialog, {
  type ExpirationDialogTarget,
} from './expiration-action-dialog';
import ExpirationFilter from './expiration-filter';
import ExpirationTable from './expiration-table';
import { updateExpirationSelection } from './expiration-utils';
import type { ExpirationPageState } from './get-expiration-page';
import Pagination from '@/shared/components/pagination';
import { Button } from '@/shared/components/ui/button';
import {
  CalendarClock,
  CalendarDays,
  Infinity as InfinityIcon,
  RefreshCw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

type Props = {
  state: ExpirationPageState;
  query: string;
};

const operationIcons = {
  set: CalendarDays,
  adjust: CalendarClock,
  clear: InfinityIcon,
};

export default function ExpirationPage({ state, query }: Props) {
  const t = useTranslations('accountExpiration');
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>([]);
  const anchor = useRef<number | null>(null);
  const [target, setTarget] = useState<ExpirationDialogTarget | null>(null);
  const refresh = () => startTransition(() => router.refresh());
  const openBulk = (operation: ExpirationDialogTarget['operation']) => {
    if (state.kind !== 'data' || !selected.length) return;
    if (
      operation === 'adjust' &&
      state.data.udocs.some(
        (user) => selected.includes(user._id) && !user.accountExpireDate
      )
    ) {
      toast.error(t('finiteRequired'));
      return;
    }
    setTarget({ operation, uids: selected });
  };

  return (
    <section
      className="space-y-5"
      data-llm-visible="true"
      aria-busy={refreshing}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-llm-text={t('title')}>
            {t('title')}
          </h1>
          {state.kind === 'data' && (
            <p
              className="mt-1 text-sm text-muted-foreground"
              data-llm-text={t('count', { count: state.data.count })}
            >
              {t('count', { count: state.data.count })}
            </p>
          )}
        </div>
        {state.kind === 'data' && <ExpirationFilter query={query} />}
      </div>
      {state.kind === 'error' && (
        <div className="space-y-3 rounded-lg border p-5">
          <p role="alert" data-llm-text={state.message}>
            {state.message}
          </p>
          <Button variant="secondary" disabled={refreshing} onClick={refresh}>
            <RefreshCw
              aria-hidden="true"
              className={refreshing ? 'animate-spin' : undefined}
            />
            {t('retry')}
          </Button>
        </div>
      )}
      {state.kind === 'data' && (
        <>
          <ExpirationTable
            users={state.data.udocs}
            selected={selected}
            disabled={refreshing || !!target}
            onSelectAll={(checked) => {
              setSelected(
                checked
                  ? state.data.udocs
                      .filter((user) => !user.accountExpirationProtected)
                      .map((user) => user._id)
                  : []
              );
              anchor.current = null;
            }}
            onToggle={(index, range) => {
              const previousAnchor = anchor.current;
              setSelected((current) =>
                updateExpirationSelection(
                  state.data.udocs,
                  current,
                  index,
                  previousAnchor,
                  range
                )
              );
              anchor.current = index;
            }}
            onEdit={(user) =>
              setTarget({
                operation: 'set',
                uids: [user._id],
                expireDate: user.accountExpireDate,
              })
            }
          />
          {!!state.data.udocs.length && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="mr-2 text-sm text-muted-foreground"
                data-llm-text={t('selected', { count: selected.length })}
              >
                {t('selected', { count: selected.length })}
              </span>
              {(['set', 'adjust', 'clear'] as const).map((operation) => {
                const Icon = operationIcons[operation];
                return (
                  <Button
                    key={operation}
                    variant={operation === 'set' ? 'default' : 'outline'}
                    disabled={!selected.length || refreshing || !!target}
                    onClick={() => openBulk(operation)}
                  >
                    <Icon aria-hidden="true" />
                    {t(`operation.${operation}`)}
                  </Button>
                );
              })}
            </div>
          )}
          <Pagination page={state.data.page} totalPages={state.data.numPages} />
        </>
      )}
      {target && (
        <ExpirationActionDialog
          target={target}
          onClose={() => setTarget(null)}
          onSuccess={() => {
            setSelected([]);
            anchor.current = null;
            setTarget(null);
            toast.success(t('success'));
            refresh();
          }}
        />
      )}
    </section>
  );
}

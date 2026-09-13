'use client';

import ConfirmActionDialog from '@/shared/components/confirm-action-dialog';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import {
  matchesBackendPath,
  normalizeBackendPathname,
} from '@/shared/lib/backend-response';
import type { Errorable } from '@/shared/types/error';
import { LoaderCircle, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

export type ConfirmDeleteButtonProps = {
  id: string;
  namespace: string;
  listRoute: string;
  onDelete: (id: string) => Promise<Errorable<{ url?: string }>>;
  disabled?: boolean;
  variant?: ComponentPropsWithoutRef<typeof Button>['variant'];
  className?: string;
};

export default function ConfirmDeleteButton({
  id,
  namespace,
  listRoute,
  onDelete,
  disabled,
  variant = 'destructive',
  className,
}: ConfirmDeleteButtonProps) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations('common');
  const router = useRouter();

  return (
    <ConfirmActionDialog
      title={t('delete')}
      description={t('deleteConfirm')}
      confirmLabel={t('delete')}
      pendingLabel={t('deleting')}
      cancelLabel={tCommon('cancel')}
      fallbackError={t('deleteFailed')}
      onConfirm={async () => {
        const response = await onDelete(id);
        if ('error' in response)
          throw new Error(parseErrorMessage(response.error));
        // A denied delete can come back as a redirect (e.g. to the login or
        // domain-join page) instead of an error payload; honor it instead of
        // treating the response as a successful deletion.
        const target =
          typeof response?.url === 'string' &&
          !matchesBackendPath(response.url, listRoute)
            ? normalizeBackendPathname(response.url)
            : listRoute;
        router.push(target);
        router.refresh();
      }}
      trigger={(pending) => (
        <Button
          type="button"
          variant={variant}
          className={className}
          disabled={pending || disabled}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Trash />}
          {pending ? t('deleting') : t('delete')}
        </Button>
      )}
    />
  );
}

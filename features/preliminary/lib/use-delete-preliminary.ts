import ClientApis from '@/api/client/method';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export function useDeletePreliminary(paperId: string): {
  deleting: boolean;
  deleteError: string | undefined;
  handleDelete: () => Promise<void>;
} {
  const t = useTranslations('preliminary');
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    if (!window.confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      const response =
        await ClientApis.Preliminary.deletePreliminary(paperId).send();
      if (!response || 'error' in response) {
        setDeleteError(t('deleteFailed'));
        return;
      }
      router.push('/preliminary');
      router.refresh();
    } catch {
      setDeleteError(t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  }, [deleting, paperId, router, t]);

  return { deleting, deleteError, handleDelete };
}

'use client';

import ClientApis from '@/api/client/method';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { LoaderCircle, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';

type Props = { id: string };

export default function PasteDeleteButton({ id }: Props) {
  const t = useTranslations('paste');
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  const onDelete = async () => {
    if (deleting) return;
    setError(undefined);
    setDeleting(true);
    try {
      const response = await ClientApis.Paste.deletePaste(id).send();
      if ('error' in response)
        throw new Error(parseErrorMessage(response.error));
      setOpen(false);
      router.push('/paste');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : t('deleteFailed')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <AlertDialog.Trigger asChild>
        <Button type="button" variant="destructive" disabled={deleting}>
          {deleting ? <LoaderCircle className="animate-spin" /> : <Trash />}
          {deleting ? t('deleting') : t('delete')}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <AlertDialog.Content
          className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-lg"
          data-llm-visible="true"
        >
          <AlertDialog.Title
            className="text-lg font-semibold"
            data-llm-text={t('delete')}
          >
            {t('delete')}
          </AlertDialog.Title>
          <AlertDialog.Description
            className="text-muted-foreground mt-2 text-sm"
            data-llm-text={t('deleteConfirm')}
          >
            {t('deleteConfirm')}
          </AlertDialog.Description>
          {error && (
            <FieldError className="mt-2" errors={[{ message: error }]} />
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={deleting}>
                {t('cancel')}
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void onDelete()}
            >
              {deleting && <LoaderCircle className="animate-spin" />}
              {deleting ? t('deleting') : t('delete')}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

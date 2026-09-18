'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CircleAlert, LoaderCircle, MessageSquareWarning } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  pid: string | number;
  tid?: string;
};

export default function ProblemFeedbackDialog({ pid, tid }: Props) {
  const t = useTranslations('problemFeedback.submit');
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const normalizedContent = content.trim();

  const submit = async () => {
    if (!normalizedContent || submitting) return;
    setSubmitting(true);
    try {
      await ClientApis.Problem.submitProblemFeedback(
        pid,
        normalizedContent,
        tid
      ).send();
      toast.success(t('success'));
      setContent('');
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t('failed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) setOpen(nextOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full justify-start gap-3 px-4"
        >
          <MessageSquareWarning strokeWidth={2} />
          <span data-llm-text={t('trigger')}>{t('trigger')}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-5 shadow-lg"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="text-lg font-semibold"
            data-llm-text={t('title')}
          >
            {t('title')}
          </Dialog.Title>
          <Dialog.Description
            className="mt-2 text-sm text-muted-foreground"
            data-llm-text={t('description')}
          >
            {t('description')}
          </Dialog.Description>
          <div className="mt-4 space-y-2">
            <Label htmlFor="problem-feedback-content">{t('label')}</Label>
            <Textarea
              id="problem-feedback-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t('placeholder')}
              disabled={submitting}
              maxLength={1000}
              rows={6}
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">
              {t('characterCount', { count: content.length })}
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" disabled={submitting}>
                {t('cancel')}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              onClick={submit}
              disabled={!normalizedContent || submitting}
            >
              {submitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CircleAlert />
              )}
              {submitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

'use client';

import {
  hasUnsavedStatementChange,
  shouldApplyHtmlToMarkdownResult,
  shouldPromptHtmlToMarkdown,
} from './html-to-markdown-guard';
import type { ProblemFormValues } from './problem-form';
import ClientApis from '@/api/client/method';
import { isHtmlContent } from '@/features/problem/lib/detect-html-content';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';
import type {
  Control,
  UseFormGetValues,
  UseFormSetValue,
} from 'react-hook-form';
import { useWatch } from 'react-hook-form';

type Props = {
  pid: string;
  originalContent: string;
  control: Control<ProblemFormValues>;
  getValues: UseFormGetValues<ProblemFormValues>;
  setValue: UseFormSetValue<ProblemFormValues>;
  disabled?: boolean;
};

export default function HtmlToMarkdownSection({
  pid,
  originalContent,
  control,
  getValues,
  setValue,
  disabled,
}: Props) {
  const t = useTranslations('problemEdit.htmlToMarkdown');
  const content = useWatch({ control, name: 'content' }) ?? '';
  const [dialogOpen, setDialogOpen] = useState(() =>
    isHtmlContent(originalContent)
  );
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  const htmlDetected = isHtmlContent(content);
  const hasUnsavedContent = hasUnsavedStatementChange(content, originalContent);

  const handleConvert = async () => {
    const contentWhenStarted = getValues('content') ?? '';
    setIsConverting(true);
    setError('');
    try {
      const response = await ClientApis.Problem.htmlToMarkdown(pid).send();
      if (response && 'error' in response) {
        setError(parseErrorMessage(response.error));
        return;
      }
      if (!response || typeof response.markdown !== 'string') {
        setError(t('failed'));
        return;
      }
      if (
        !shouldApplyHtmlToMarkdownResult(
          getValues('content') ?? '',
          contentWhenStarted
        )
      ) {
        setError(t('contentChangedDuringConversion'));
        return;
      }
      const markdown = response.markdown;
      setValue('content', markdown, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDialogOpen(false);
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : t('failed');
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleManualClick = () => {
    if (shouldPromptHtmlToMarkdown(content, originalContent)) {
      setDialogOpen(true);
    } else {
      void handleConvert();
    }
  };

  const dialogTitle = htmlDetected ? t('detectedTitle') : t('unsavedTitle');
  const dialogDescription = htmlDetected
    ? t('detectedDescription')
    : t('unsavedWarning');

  return (
    <>
      <Separator />
      <div className="space-y-3" data-llm-visible="true">
        <header className="space-y-1">
          <h3
            className="flex items-center gap-2 text-sm font-medium"
            data-llm-text={t('title')}
          >
            <FileText className="text-muted-foreground size-4" />
            {t('title')}
          </h3>
          <p className="text-muted-foreground text-xs">{t('description')}</p>
        </header>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleManualClick}
          disabled={disabled || isConverting}
        >
          {isConverting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wand2 className="size-4" />
          )}
          {isConverting ? t('converting') : t('button')}
        </Button>
        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>

      <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
          <AlertDialog.Content
            className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-lg"
            data-llm-visible="true"
          >
            <AlertDialog.Title
              className="text-lg font-semibold"
              data-llm-text={dialogTitle}
            >
              {dialogTitle}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground mt-2 text-sm">
              {dialogDescription}
            </AlertDialog.Description>
            {htmlDetected && hasUnsavedContent && (
              <p
                className="text-muted-foreground mt-2 text-sm font-medium"
                data-llm-text={t('unsavedWarning')}
                role="status"
              >
                {t('unsavedWarning')}
              </p>
            )}
            {error && (
              <p className="text-destructive mt-3 text-sm" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isConverting}
                  data-llm-text={t('cancel')}
                >
                  {t('cancel')}
                </Button>
              </AlertDialog.Cancel>
              <Button
                type="button"
                disabled={isConverting}
                onClick={() => void handleConvert()}
                data-llm-text={t('confirm')}
              >
                {isConverting && <Loader2 className="size-4 animate-spin" />}
                {isConverting ? t('converting') : t('confirm')}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

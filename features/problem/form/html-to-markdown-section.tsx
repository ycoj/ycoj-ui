'use client';

import ClientApis from '@/api/client/method';
import { getConvertPrompt } from '@/features/problem/form/html-to-markdown-prompt';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AlertDialog } from 'radix-ui';
import { useState } from 'react';
import { toast } from 'sonner';

type DialogMode = 'closed' | 'auto-html' | 'confirm';

type Props = {
  pid: string;
  originalContent: string;
  content: string;
  getContent: () => string;
  onApply: (markdown: string) => void;
  disabled?: boolean;
};

export default function HtmlToMarkdownSection({
  pid,
  originalContent,
  content,
  getContent,
  onApply,
  disabled,
}: Props) {
  const t = useTranslations('problemEdit.htmlToMarkdown');
  const [mode, setMode] = useState<DialogMode>(() =>
    getConvertPrompt(originalContent, originalContent).kind === 'html'
      ? 'auto-html'
      : 'closed'
  );
  const [isConverting, setIsConverting] = useState(false);

  const prompt = getConvertPrompt(content, originalContent);
  const dialogTitle =
    prompt.kind === 'html' ? t('detectedTitle') : t('unsavedTitle');
  const dialogDescription =
    prompt.kind === 'html' ? t('detectedDescription') : t('unsavedWarning');

  const handleConvert = async () => {
    const contentWhenStarted = getContent();
    setIsConverting(true);
    try {
      const response = await ClientApis.Problem.htmlToMarkdown(pid).send();
      if ('error' in response) {
        toast.error(parseErrorMessage(response.error));
        return;
      }
      if (getContent() !== contentWhenStarted) {
        toast.error(t('contentChangedDuringConversion'));
        return;
      }
      onApply(response.markdown);
      setMode('closed');
      toast.success(t('success'));
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message : t('failed')
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleManualClick = () => {
    if (getConvertPrompt(content, originalContent).kind === 'none') {
      void handleConvert();
    } else {
      setMode('confirm');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isConverting) return;
    if (!open) setMode('closed');
  };

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
      </div>

      <AlertDialog.Root
        open={mode !== 'closed'}
        onOpenChange={handleOpenChange}
      >
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
            {prompt.kind === 'html' && prompt.unsaved && (
              <p
                className="text-muted-foreground mt-2 text-sm font-medium"
                data-llm-text={t('unsavedWarning')}
                role="status"
              >
                {t('unsavedWarning')}
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

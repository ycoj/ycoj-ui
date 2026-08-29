'use client';

import { Button } from '@/shared/components/ui/button';
import { ArrowRight, FileArchive, FilePlus2, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Dialog } from 'radix-ui';

const importFormats = ['hydro', 'fps', 'hoj', 'qduoj', 'lvj'] as const;

export default function ProblemCreateOrImportDialog() {
  const t = useTranslations('problem');

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="secondary" className="shrink-0">
          <Plus />
          <span data-llm-text={t('createOrImport')}>{t('createOrImport')}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 shadow-xl outline-none"
          data-llm-visible="true"
        >
          <div className="pr-10">
            <Dialog.Title
              className="text-lg font-semibold"
              data-llm-text={t('addProblem')}
            >
              {t('addProblem')}
            </Dialog.Title>
          </div>
          <Dialog.Close asChild>
            <Button
              variant="secondary"
              size="icon-sm"
              className="absolute top-4 right-4"
              aria-label={t('close')}
            >
              <X />
            </Button>
          </Dialog.Close>

          <div className="mt-5 space-y-3">
            <Button
              asChild
              variant="secondary"
              className="h-auto w-full justify-between px-4 py-3"
            >
              <Link href="/problem/create">
                <span className="flex items-center gap-3">
                  <FilePlus2 className="size-5" />
                  <span className="text-left">
                    <span className="block" data-llm-text={t('createProblem')}>
                      {t('createProblem')}
                    </span>
                    <span
                      className="text-muted-foreground block text-xs font-normal"
                      data-llm-text={t('createProblemDescription')}
                    >
                      {t('createProblemDescription')}
                    </span>
                  </span>
                </span>
                <ArrowRight />
              </Link>
            </Button>

            <div>
              <p
                className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide"
                data-llm-text={t('importProblem')}
              >
                {t('importProblem')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {importFormats.map((format) => (
                  <Button
                    key={format}
                    asChild
                    variant="secondary"
                    className="h-11 justify-between px-3"
                  >
                    <Link href={`/problem/import/${format}`}>
                      <span className="flex items-center gap-2">
                        <FileArchive className="text-muted-foreground" />
                        <span data-llm-text={t(`importFormats.${format}`)}>
                          {t(`importFormats.${format}`)}
                        </span>
                      </span>
                      <ArrowRight className="text-muted-foreground" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

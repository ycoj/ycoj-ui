'use client';

import parseErrorMessage from './parse-message';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import type { HydroError } from '@/shared/types/error';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  title?: string;
  error: HydroError | string;
};

export default function Errored({ title, error }: Props) {
  const t = useTranslations('error');
  const resolvedTitle = title ?? t('unavailable');
  const errorMessage = parseErrorMessage(error);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Empty data-llm-visible="true">
      <EmptyMedia variant="icon">
        <AlertCircle strokeWidth={2} />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle data-llm-text={resolvedTitle}>{resolvedTitle}</EmptyTitle>
        <EmptyDescription className="font-mono" data-llm-text={errorMessage}>
          {errorMessage}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft strokeWidth={2} />
            {t('back')}
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw strokeWidth={2} />
            {t('refresh')}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

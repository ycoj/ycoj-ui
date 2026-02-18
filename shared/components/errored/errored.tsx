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

type Props = {
  title?: string;
  error: HydroError | string;
};

export default function Errored({ title = '内容暂不可用', error }: Props) {
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
        <EmptyTitle data-llm-text={title}>{title}</EmptyTitle>
        <EmptyDescription className="font-mono" data-llm-text={errorMessage}>
          {errorMessage}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft strokeWidth={2} />
            返回
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw strokeWidth={2} />
            刷新
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

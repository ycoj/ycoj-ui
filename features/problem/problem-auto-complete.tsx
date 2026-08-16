'use client';

import ClientApis from '@/api/client/method';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import AsyncAutoComplete from '@/shared/components/async-auto-complete';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

type Props = {
  domainId: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onBlur?: () => void;
};

export default function ProblemAutoComplete({ domainId, ...props }: Props) {
  const t = useTranslations('autoComplete');
  const searchItems = useCallback(
    async (query: string) =>
      (await ClientApis.Problem.searchProblems(domainId, query).send()).pdocs,
    [domainId]
  );

  return (
    <AsyncAutoComplete<ProblemAutoCompleteItem>
      {...props}
      searchItems={searchItems}
      itemKey={(problem) => String(problem.docId)}
      itemLabel={(problem) =>
        `${problem.pid ? `${problem.pid} ` : ''}${problem.title}`
      }
      renderItem={(problem) => (
        <div className="min-w-0">
          <div
            className="truncate font-medium"
            data-llm-text={`${problem.pid ? `${problem.pid} ` : ''}${problem.title}`}
          >
            {problem.pid && `${problem.pid} `}
            {problem.title}
          </div>
          <div
            className="text-muted-foreground text-xs"
            data-llm-text={t('problemId', { id: problem.docId })}
          >
            {t('problemId', { id: problem.docId })}
          </div>
        </div>
      )}
      messages={{
        clear: t('clear'),
        loadFailed: t('loadFailed'),
        loading: t('loading'),
        noResults: t('noResults'),
      }}
      allowEmptyQuery
    />
  );
}

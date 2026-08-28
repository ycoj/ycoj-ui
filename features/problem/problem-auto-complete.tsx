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
  id?: string;
  onBlur?: () => void;
  onItemSelect?: (item: ProblemAutoCompleteItem) => void;
};

const problemKey = (problem: ProblemAutoCompleteItem) => String(problem.docId);

const problemLabel = (problem: ProblemAutoCompleteItem) =>
  `${problem.pid ? `${problem.pid} ` : ''}${problem.title}`;

export default function ProblemAutoComplete({ domainId, ...props }: Props) {
  const t = useTranslations('autoComplete');
  const searchItems = useCallback(
    async (query: string) =>
      (await ClientApis.Problem.searchProblems(domainId, query).send()).pdocs,
    [domainId]
  );
  const resolveItem = useCallback(
    async (value: string) => {
      if (!/^\d+$/.test(value.trim())) return null;

      const docId = Number(value);
      const items = await searchItems(value);
      return items.find((problem) => problem.docId === docId) ?? null;
    },
    [searchItems]
  );

  return (
    <AsyncAutoComplete<ProblemAutoCompleteItem>
      {...props}
      searchItems={searchItems}
      resolveItem={resolveItem}
      itemKey={problemKey}
      itemLabel={problemLabel}
      itemInputLabel={(problem) => problem.title}
      renderItem={(problem) => (
        <div className="min-w-0">
          <div
            className="truncate font-medium"
            data-llm-text={problemLabel(problem)}
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

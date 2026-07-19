'use client';

import ClientApis from '@/api/client/method';
import type {
  ContestProblemsData,
  ContestProblemsResponse,
} from '@/api/server/method/contests/problems';
import ContestProblemList from '@/features/contest/detail/contest-problem-list';
import { Errored } from '@/shared/components/errored';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import type { HydroError } from '@/shared/types/error';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Props = {
  tid: string;
};

export default function ContestProblemsTab({ tid }: Props) {
  const t = useTranslations('problem');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hydroError, setHydroError] = useState<HydroError | null>(null);
  const [problemsData, setProblemsData] = useState<ContestProblemsData | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const loadProblems = async () => {
      setLoading(true);
      setError('');
      setHydroError(null);

      try {
        const data: ContestProblemsResponse =
          await ClientApis.Contest.getContestProblems(tid).send();
        if (!cancelled) {
          if ('error' in data) {
            setHydroError(data.error);
            setProblemsData(null);
            return;
          }

          setProblemsData(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : t('listLoadFailed');
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProblems();

    return () => {
      cancelled = true;
    };
  }, [t, tid]);

  if (loading) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('listLoading')}>
            {t('listLoading')}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  if (hydroError) {
    return <Errored title={t('listUnavailable')} error={hydroError} />;
  }

  if (error) {
    return <Errored title={t('listLoadFailed')} error={error} />;
  }

  if (!problemsData) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text={t('none')}>{t('none')}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ContestProblemList tid={tid} data={problemsData} />;
}

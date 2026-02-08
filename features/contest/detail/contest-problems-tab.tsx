'use client';

import ClientApis from '@/api/client/method';
import type {
  ContestProblemsData,
  ContestProblemsResponse,
} from '@/api/server/method/contests/problems';
import ContestProblemList from '@/features/contest/detail/contest-problem-list';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import type { HydroError } from '@/shared/types/error';
import { useEffect, useState } from 'react';

type Props = {
  tid: string;
};

export default function ContestProblemsTab({ tid }: Props) {
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
            loadError instanceof Error ? loadError.message : '题目列表加载失败';
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
  }, [tid]);

  if (loading) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="题目列表加载中...">
            题目列表加载中...
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  if (hydroError) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="题目列表暂不可用">
            题目列表暂不可用
          </EmptyTitle>
          <EmptyDescription data-llm-text={hydroError.message}>
            {hydroError.message}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (error) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="题目列表加载失败">
            题目列表加载失败
          </EmptyTitle>
          <EmptyDescription data-llm-text={error}>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!problemsData) {
    return (
      <Empty data-llm-visible="true">
        <EmptyHeader>
          <EmptyTitle data-llm-text="暂无题目">暂无题目</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return <ContestProblemList tid={tid} data={problemsData} />;
}

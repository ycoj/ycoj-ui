'use client';

import ClientApis from '@/api/client/method';
import type { ContestProblemsResponse } from '@/api/server/method/contests/problems';
import ContestProblemList from '@/features/contest/detail/contest-problem-list';
import { useEffect, useState } from 'react';

type Props = {
  tid: string;
};

export default function ContestProblemsTab({ tid }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [problemsData, setProblemsData] =
    useState<ContestProblemsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProblems = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await ClientApis.Contest.getContestProblems(tid).send();
        if (!cancelled) {
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
      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        <span data-llm-text="题目列表加载中...">题目列表加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-destructive">
        <span data-llm-text={error}>{error}</span>
      </div>
    );
  }

  if (!problemsData) {
    return (
      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        <span data-llm-text="暂无题目">暂无题目</span>
      </div>
    );
  }

  return <ContestProblemList tid={tid} data={problemsData} />;
}

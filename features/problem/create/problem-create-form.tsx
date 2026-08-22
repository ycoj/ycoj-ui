'use client';

import { DEFAULT_PROBLEM_CONTENT } from './default-problem-content';
import ClientApis from '@/api/client/method';
import ProblemForm from '@/features/problem/form/problem-form';
import { useTranslations } from 'next-intl';

type Props = {
  tags: Record<string, string[]>;
};

export default function ProblemCreateForm({ tags }: Props) {
  const t = useTranslations('problemCreate');

  return (
    <ProblemForm
      mode="create"
      tags={tags}
      cancelHref="/problem"
      defaultValues={{
        pid: '',
        title: '',
        tag: '',
        difficulty: 0,
        hidden: false,
        content: DEFAULT_PROBLEM_CONTENT,
      }}
      onSubmit={async (values) => {
        const response = await ClientApis.Problem.createProblem({
          ...values,
          pid: values.pid.trim() || undefined,
          title: values.title.trim(),
          tag: values.tag.trim(),
        }).send();

        if (response?.pid !== undefined) return `/problem/${response.pid}`;
        throw new Error(t('submitFailed'));
      }}
    />
  );
}

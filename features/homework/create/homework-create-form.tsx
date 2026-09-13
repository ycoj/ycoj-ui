'use client';

import ClientApis from '@/api/client/method';
import HomeworkForm from '@/features/homework/form/homework-form';
import {
  buildCreateHomeworkPayload,
  type HomeworkFormValues,
} from '@/features/homework/form/homework-form-utils';
import { requireTid } from '@/shared/lib/backend-response';
import { useTranslations } from 'next-intl';

type Props = {
  defaultValues: HomeworkFormValues;
  domainId: string;
};

export default function HomeworkCreateForm({ defaultValues, domainId }: Props) {
  const t = useTranslations('homeworkCreate');

  return (
    <HomeworkForm
      mode="create"
      defaultValues={defaultValues}
      domainId={domainId}
      cancelHref="/homework"
      onSubmit={async (values) => {
        const response = await ClientApis.Homework.createHomework(
          buildCreateHomeworkPayload(values)
        ).send();
        return `/homework/${requireTid(response, t('submitFailed'))}`;
      }}
    />
  );
}

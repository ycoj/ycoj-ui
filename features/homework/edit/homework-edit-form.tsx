'use client';

import ClientApis from '@/api/client/method';
import HomeworkForm from '@/features/homework/form/homework-form';
import {
  buildCreateHomeworkPayload,
  type HomeworkFormValues,
} from '@/features/homework/form/homework-form-utils';
import { useTranslations } from 'next-intl';

type Props = {
  tid: string;
  defaultValues: HomeworkFormValues;
  domainId: string;
};

export default function HomeworkEditForm({
  tid,
  defaultValues,
  domainId,
}: Props) {
  const t = useTranslations('homeworkEdit');

  return (
    <HomeworkForm
      mode="edit"
      defaultValues={defaultValues}
      domainId={domainId}
      cancelHref={`/homework/${tid}`}
      onSubmit={async (values) => {
        const response = await ClientApis.Homework.editHomework(
          tid,
          buildCreateHomeworkPayload(values)
        ).send();
        if (!response?.tid) throw new Error(t('submitFailed'));
        return `/homework/${response.tid}`;
      }}
    />
  );
}

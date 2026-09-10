'use client';

import ClientApis from '@/api/client/method';
import HomeworkDeleteButton from '@/features/homework/edit/homework-delete-button';
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
  canClone: boolean;
};

export default function HomeworkEditForm({
  tid,
  defaultValues,
  domainId,
  canClone,
}: Props) {
  const t = useTranslations('homeworkEdit');

  const handleClone = async (values: HomeworkFormValues) => {
    const response = await ClientApis.Homework.createHomework(
      buildCreateHomeworkPayload(values)
    ).send();
    if (!response?.tid) throw new Error(t('cloneFailed'));
    return `/homework/${response.tid}`;
  };

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
      onClone={canClone ? handleClone : undefined}
      extraActions={<HomeworkDeleteButton tid={tid} />}
    />
  );
}

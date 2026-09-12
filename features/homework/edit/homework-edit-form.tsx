'use client';

import ClientApis from '@/api/client/method';
import HomeworkForm from '@/features/homework/form/homework-form';
import {
  buildCreateHomeworkPayload,
  type HomeworkFormValues,
} from '@/features/homework/form/homework-form-utils';
import ConfirmDeleteButton from '@/shared/components/confirm-delete-button';
import parseErrorMessage from '@/shared/components/errored/parse-message';
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
    if ('error' in response) throw new Error(parseErrorMessage(response.error));
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
        if ('error' in response)
          throw new Error(parseErrorMessage(response.error));
        if (!response?.tid) throw new Error(t('submitFailed'));
        return `/homework/${response.tid}`;
      }}
      onClone={canClone ? handleClone : undefined}
      extraActions={
        <ConfirmDeleteButton
          id={tid}
          namespace="homeworkEdit"
          listRoute="/homework"
          onDelete={(id) => ClientApis.Homework.deleteHomework(id).send()}
        />
      }
    />
  );
}

'use client';

import ClientApis from '@/api/client/method';
import PasteForm from '@/features/paste/form/paste-form';
import {
  buildPastePayload,
  getPasteDefaults,
  type PasteFormValues,
} from '@/features/paste/form/paste-form-utils';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import type { PasteFormOptions } from '@/shared/types/paste';
import { useTranslations } from 'next-intl';

type Props = { options: PasteFormOptions };

export default function PasteCreateForm({ options }: Props) {
  const t = useTranslations('paste');

  const onSubmit = async (values: PasteFormValues) => {
    const response = await ClientApis.Paste.createPaste(
      buildPastePayload(values)
    ).send();
    if ('error' in response) throw new Error(parseErrorMessage(response.error));
    return `/paste/${encodeURIComponent(response.id)}`;
  };

  return (
    <PasteForm
      options={options}
      defaultValues={getPasteDefaults(options)}
      heading={t('create')}
      submitLabel={t('share')}
      onSubmit={onSubmit}
    />
  );
}

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

type Props = { options: PasteFormOptions };

export default function PasteCreateForm({ options }: Props) {
  const onSubmit = async (values: PasteFormValues) => {
    const response = await ClientApis.Paste.createPaste(
      buildPastePayload(values)
    ).send();
    if ('error' in response) throw new Error(parseErrorMessage(response.error));
    return `/paste/${encodeURIComponent(response.id)}`;
  };

  return (
    <PasteForm
      mode="create"
      options={options}
      defaultValues={getPasteDefaults(options)}
      onSubmit={onSubmit}
    />
  );
}

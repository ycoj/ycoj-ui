'use client';

import ClientApis from '@/api/client/method';
import PasteDeleteButton from '@/features/paste/edit/paste-delete-button';
import PasteForm from '@/features/paste/form/paste-form';
import {
  buildPastePayload,
  getPasteDefaults,
  type PasteFormValues,
} from '@/features/paste/form/paste-form-utils';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import type { PasteDoc, PasteFormOptions } from '@/shared/types/paste';

type Props = { options: PasteFormOptions; paste: PasteDoc };

export default function PasteEditForm({ options, paste }: Props) {
  const href = `/paste/${encodeURIComponent(paste._id)}`;

  const onSubmit = async (values: PasteFormValues) => {
    const response = await ClientApis.Paste.updatePaste(
      paste._id,
      buildPastePayload(values)
    ).send();
    if ('error' in response) throw new Error(parseErrorMessage(response.error));
    return href;
  };

  return (
    <PasteForm
      mode="edit"
      options={options}
      defaultValues={getPasteDefaults(options, paste)}
      extraActions={(isSubmitting) => (
        <PasteDeleteButton id={paste._id} disabled={isSubmitting} />
      )}
      cancelHref={href}
      onSubmit={onSubmit}
    />
  );
}

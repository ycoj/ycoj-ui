'use client';

import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import { Copy, LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import {
  useForm,
  type Control,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Resolver,
  type UseFormRegister,
} from 'react-hook-form';

type CloneDialogHelpers<TValues extends FieldValues> = {
  control: Control<TValues>;
  register: UseFormRegister<TValues>;
  errors: FieldErrors<TValues>;
  isSubmitting: boolean;
};

type Props<TValues extends FieldValues> = {
  title: string;
  description: string;
  cloneLabel: string;
  cloningLabel: string;
  failedLabel: string;
  resolver: Resolver<TValues, unknown, TValues>;
  defaultValues: DefaultValues<TValues>;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: TValues) => Promise<void>;
  children: (helpers: CloneDialogHelpers<TValues>) => ReactNode;
};

export default function CloneDialog<TValues extends FieldValues>({
  title,
  description,
  cloneLabel,
  cloningLabel,
  failedLabel,
  resolver,
  defaultValues,
  onOpenChange,
  onConfirm,
  children,
}: Props<TValues>) {
  const tCommon = useTranslations('common');
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TValues, unknown, TValues>({
    resolver,
    defaultValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onConfirm(values);
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof Error && error.message ? error.message : failedLabel,
      });
    }
  });

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && isSubmitting) return;
        onOpenChange(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-lg"
          data-llm-visible="true"
        >
          <Dialog.Title className="text-lg font-semibold" data-llm-text={title}>
            {title}
          </Dialog.Title>
          <Dialog.Description
            className="text-muted-foreground mt-2 text-sm"
            data-llm-text={description}
          >
            {description}
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            noValidate
            onSubmit={(event) => {
              event.stopPropagation();
              void submit(event);
            }}
          >
            {children({ control, register, errors, isSubmitting })}
            <FieldError errors={[errors.root?.serverError]} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                <X aria-hidden="true" />
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {isSubmitting ? cloningLabel : cloneLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

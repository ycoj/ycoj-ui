'use client';

import ClientApis from '@/api/client/method';
import type { UserImportResult } from '@/api/client/method/user/import';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Textarea } from '@/shared/components/ui/textarea';
import { throwBackendError } from '@/shared/lib/backend-response';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileSearch, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const example =
  'student1@example.com,student1,ChangeMe123!,Student One,{"group":"Class A","school":"Example School","studentId":"001"}';

type Preview = UserImportResult & { source: string; total: number };

export default function UserImportForm() {
  const t = useTranslations('userImport');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const schema = z.object({
    users: z.string().refine((value) => !!value.trim(), t('required')),
  });
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { users: '' },
  });
  const busy = isSubmitting || readingFile;

  function invalidate() {
    setPreview(null);
    setResult(null);
    clearErrors();
  }

  const submit = (draft: boolean) =>
    handleSubmit(async ({ users }) => {
      const source = users.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
      if (!draft && (!preview || preview.source !== source)) return;
      setPreview(null);
      setResult(null);
      try {
        const response = await ClientApis.User.importUsers(
          source,
          draft
        ).send();
        throwBackendError(response);
        if (!('users' in response)) throw new Error(t('failed'));
        if (draft) {
          setPreview({
            source,
            total: source.split('\n').filter((line) => line.trim()).length,
            users: response.users.map(({ email, username, displayName }) => ({
              email,
              username,
              displayName,
            })),
            messages: response.messages,
          });
        } else {
          setResult(response.messages);
        }
      } catch (error) {
        setError('root', {
          message: `${error instanceof Error ? error.message : t('failed')}${draft ? '' : ` ${t('retryNotice')}`}`,
        });
      }
    });

  return (
    <section className="min-w-0 space-y-6" data-llm-visible="true">
      <header className="space-y-2">
        <h1
          className="flex items-center gap-2 text-xl font-semibold"
          data-llm-text={t('title')}
        >
          <UserPlus className="size-5" aria-hidden="true" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <details className="rounded-lg border bg-muted/30 p-4" open>
        <summary className="cursor-pointer font-medium">
          {t('formatTitle')}
        </summary>
        <div className="mt-3 space-y-3 text-sm text-muted-foreground">
          <p>{t('formatHelp')}</p>
          <p className="font-medium text-foreground">{t('columns')}</p>
          <p>{t('extraHelp')}</p>
          <pre
            className="overflow-x-auto rounded-md bg-muted p-3 text-xs"
            aria-label={t('example')}
          >
            {example}
          </pre>
          <p>{t('passwordHelp')}</p>
        </div>
      </details>
      <form onSubmit={submit(true)} className="space-y-4" noValidate>
        <Field>
          <FieldLabel htmlFor="user-import-file">{t('file')}</FieldLabel>
          <Input
            id="user-import-file"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            disabled={busy}
            aria-describedby="user-import-file-help"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              invalidate();
              setReadingFile(true);
              try {
                setValue('users', await file.text(), { shouldValidate: true });
              } catch {
                setError('root', { message: t('fileFailed') });
              } finally {
                setReadingFile(false);
              }
            }}
          />
          <p
            id="user-import-file-help"
            className="text-sm text-muted-foreground"
          >
            {t('fileHelp')}
          </p>
        </Field>
        <Field>
          <FieldLabel htmlFor="user-import-source">{t('users')}</FieldLabel>
          <Textarea
            id="user-import-source"
            rows={9}
            className="font-mono text-sm"
            spellCheck={false}
            autoComplete="off"
            disabled={busy}
            aria-invalid={!!errors.users}
            aria-describedby={
              errors.users ? 'user-import-source-error' : undefined
            }
            {...register('users', { onChange: invalidate })}
          />
          <div id="user-import-source-error">
            <FieldError errors={[errors.users]} />
          </div>
        </Field>
        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" disabled={busy}>
            <FileSearch aria-hidden="true" />
            {busy ? t('working') : t('preview')}
          </Button>
          <Button
            type="button"
            disabled={busy || !preview?.users.length}
            onClick={submit(false)}
          >
            <UserPlus aria-hidden="true" />
            {t('import', { count: preview?.users.length ?? 0 })}
          </Button>
        </div>
      </form>
      {preview && (
        <section
          className="space-y-3 rounded-lg border p-4"
          aria-label={t('previewTitle')}
        >
          <h2 className="font-semibold" role="status">
            {t('previewCount', {
              count: preview.users.length,
              total: preview.total,
            })}
          </h2>
          <p className="text-sm text-muted-foreground">{t('previewHelp')}</p>
          <ul className="max-h-48 list-inside list-disc overflow-auto text-sm">
            {preview.messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
          {preview.users.length > 0 && (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('username')}</TableHead>
                    <TableHead>{t('displayName')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.displayName || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
      {result && (
        <section className="space-y-3 rounded-lg border p-4" role="status">
          <h2 className="font-semibold">{t('resultTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('resultHelp')}</p>
          <ul className="max-h-72 list-inside list-disc overflow-auto text-sm">
            {result.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

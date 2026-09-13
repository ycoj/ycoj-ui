'use client';

import UserImportDialog from './user-import-dialog';
import PasswordsDialog, {
  type PasswordFill,
} from './user-import-passwords-dialog';
import PasteDialog from './user-import-paste-dialog';
import {
  emptyRow,
  generatedEmail,
  generateUsernames,
  isRowEmpty,
  parseUsersText,
  randomPassword,
  rowNeedsFields,
  rowsToSource,
  tableToRows,
  type UserImportRow,
  type UsernamePattern,
} from './user-import-rows';
import UserImportTable, { type EditableField } from './user-import-table';
import UsernamesDialog, {
  type UsernameTarget,
} from './user-import-usernames-dialog';
import { readXlsxTable } from './user-import-xlsx';
import ClientApis from '@/api/client/method';
import type { UserImportResult } from '@/api/client/method/user/import';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { throwBackendError } from '@/shared/lib/backend-response';
import {
  ClipboardPaste,
  Download,
  FileSearch,
  FileUp,
  KeyRound,
  ListPlus,
  Plus,
  Trash2,
  UserPlus,
  WandSparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type Preview = UserImportResult & { total: number };

type DialogKind = 'usernames' | 'passwords' | 'paste' | 'clear';

export default function UserImportForm() {
  const t = useTranslations('userImport');
  const [rows, setRows] = useState<UserImportRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<'file' | 'preview' | 'import' | null>(null);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutate = (update: (current: UserImportRow[]) => UserImportRow[]) => {
    setPreview(null);
    setResult(null);
    setError('');
    setRows(update);
  };
  const addRows = (added: UserImportRow[]) => {
    const kept = added.filter((row) => !isRowEmpty(row));
    if (kept.length) mutate((current) => [...current, ...kept]);
    return kept;
  };

  const missingUsernames = rows.filter(
    (row) => !isRowEmpty(row) && !row.username.trim()
  ).length;
  const missingPasswords = rows.filter(
    (row) => !isRowEmpty(row) && !row.password.trim()
  ).length;
  const incomplete = rows.filter(
    (row) => !isRowEmpty(row) && rowNeedsFields(row)
  ).length;

  const loadFile = async (file: File) => {
    setBusy('file');
    setError('');
    try {
      const parsed = /\.xlsx$/i.test(file.name)
        ? tableToRows(await readXlsxTable(file))
        : parseUsersText(await file.text());
      const added = addRows(parsed);
      if (!added.length) {
        toast.error(t('fileEmpty'));
        return;
      }
      toast.success(t('fileLoaded', { count: added.length }));
    } catch {
      toast.error(t('fileFailed'));
    } finally {
      setBusy(null);
    }
  };

  const applyUsernames = (
    pattern: UsernamePattern,
    target: UsernameTarget
  ): boolean => {
    const names = generateUsernames(pattern);
    if (target === 'append') {
      addRows(
        names.map((username) => ({
          ...emptyRow(),
          username,
          email: generatedEmail(username),
        }))
      );
      return true;
    }
    const queue = [...names];
    mutate((current) =>
      current.map((row) => {
        if (isRowEmpty(row)) return row;
        if (row.username.trim()) {
          return row.email.trim()
            ? row
            : { ...row, email: generatedEmail(row.username.trim()) };
        }
        if (!queue.length) return row;
        const username = queue.shift()!;
        return {
          ...row,
          username,
          email: row.email.trim() ? row.email : generatedEmail(username),
        };
      })
    );
    return true;
  };

  const applyPasswords = (fill: PasswordFill): boolean => {
    mutate((current) =>
      current.map((row) => {
        if (isRowEmpty(row)) return row;
        if (fill.emptyOnly && row.password.trim()) return row;
        return {
          ...row,
          password:
            fill.mode === 'fixed'
              ? fill.password
              : randomPassword(fill.length, fill.symbols),
        };
      })
    );
    return true;
  };

  const downloadTsv = () => {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rowsToSource(rows)], {
        type: 'text/tab-separated-values;charset=utf-8',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.tsv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const runPreview = async () => {
    const source = rowsToSource(rows);
    setShowValidation(true);
    setPreview(null);
    setResult(null);
    if (!source) {
      setError(t('required'));
      return;
    }
    if (source.length >= 65536) {
      setError(t('tooLarge'));
      return;
    }
    setBusy('preview');
    setError('');
    try {
      const response = await ClientApis.User.importUsers(source, true).send();
      throwBackendError(response);
      if (!('users' in response)) throw new Error(t('failed'));
      setPreview({
        total: source.split('\n').length,
        users: response.users.map(({ email, username, displayName }) => ({
          email,
          username,
          displayName,
        })),
        messages: response.messages,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t('failed')
      );
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    if (!preview) return;
    const source = rowsToSource(rows);
    setBusy('import');
    setError('');
    try {
      const response = await ClientApis.User.importUsers(source, false).send();
      throwBackendError(response);
      if (!('users' in response)) throw new Error(t('failed'));
      setPreview(null);
      setResult(response.messages);
    } catch (requestError) {
      setPreview(null);
      setError(
        `${requestError instanceof Error ? requestError.message : t('failed')} ${t('retryNotice')}`
      );
    } finally {
      setBusy(null);
    }
  };

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
      <details className="rounded-lg border bg-muted/30 p-4">
        <summary className="cursor-pointer font-medium">
          {t('formatTitle')}
        </summary>
        <div className="mt-3 space-y-3 text-sm text-muted-foreground">
          <p>{t('formatHelp')}</p>
          <p className="font-medium text-foreground">{t('columns')}</p>
          <p>
            {t('extraHelp', {
              example:
                '{"group":"Class A","school":"Example School","studentId":"001"}',
            })}
          </p>
          <p>{t('passwordHelp')}</p>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".csv,.tsv,.txt,.xlsx,text/csv,text/tab-separated-values,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void loadFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp aria-hidden="true" />
          {t('loadFile')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => setDialog('paste')}
        >
          <ClipboardPaste aria-hidden="true" />
          {t('pasteText')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => mutate((current) => [...current, emptyRow()])}
        >
          <Plus aria-hidden="true" />
          {t('addRow')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => setDialog('usernames')}
        >
          <WandSparkles aria-hidden="true" />
          {t('generateUsernames')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null || !rows.some((row) => !isRowEmpty(row))}
          onClick={() => setDialog('passwords')}
        >
          <KeyRound aria-hidden="true" />
          {t('fillPasswords')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null || !rows.length}
          onClick={downloadTsv}
        >
          <Download aria-hidden="true" />
          {t('downloadTsv')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy !== null || !rows.length}
          onClick={() => setDialog('clear')}
        >
          <Trash2 aria-hidden="true" />
          {t('clearAll')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListPlus aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle data-llm-text={t('emptyTitle')}>
              {t('emptyTitle')}
            </EmptyTitle>
            <EmptyDescription>{t('emptyHelp')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <UserImportTable
            rows={rows}
            disabled={busy !== null}
            showPasswords={showPasswords}
            showValidation={showValidation}
            onTogglePasswords={() => setShowPasswords((value) => !value)}
            onCellChange={(id, field: EditableField, value) =>
              mutate((current) =>
                current.map((row) =>
                  row.id === id ? { ...row, [field]: value } : row
                )
              )
            }
            onRemove={(id) =>
              mutate((current) => current.filter((row) => row.id !== id))
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t('rowCount', { count: rows.length })}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => mutate((current) => [...current, emptyRow()])}
            >
              <Plus aria-hidden="true" />
              {t('addRow')}
            </Button>
          </div>
        </>
      )}

      {showValidation && incomplete > 0 && (
        <p
          className="text-sm text-amber-600 dark:text-amber-400"
          role="status"
          data-llm-text={t('missingFields', { count: incomplete })}
        >
          {t('missingFields', { count: incomplete })}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
          data-llm-text={error}
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void runPreview()}
        >
          <FileSearch aria-hidden="true" />
          {busy ? t('working') : t('preview')}
        </Button>
        <Button
          type="button"
          disabled={busy !== null || !preview?.users.length}
          onClick={() => void runImport()}
        >
          <UserPlus aria-hidden="true" />
          {t('import', { count: preview?.users.length ?? 0 })}
        </Button>
      </div>

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

      {/* Dialogs stay mounted so Radix can play the close animation; each
          controls its own open state through the `dialog` value. */}
      <UsernamesDialog
        open={dialog === 'usernames'}
        missingUsernames={missingUsernames}
        onOpenChange={() => setDialog(null)}
        onApply={applyUsernames}
      />
      <PasswordsDialog
        open={dialog === 'passwords'}
        missingPasswords={missingPasswords}
        onOpenChange={() => setDialog(null)}
        onApply={applyPasswords}
      />
      <PasteDialog
        open={dialog === 'paste'}
        onOpenChange={() => setDialog(null)}
        onApply={(text) => {
          const added = addRows(parseUsersText(text));
          if (!added.length) {
            toast.error(t('fileEmpty'));
            return false;
          }
          toast.success(t('fileLoaded', { count: added.length }));
          return true;
        }}
      />
      <UserImportDialog
        open={dialog === 'clear'}
        onOpenChange={() => setDialog(null)}
        title={t('clearTitle')}
        description={t('clearDescription', { count: rows.length })}
        applyLabel={t('clearAll')}
        onApply={() => {
          mutate(() => []);
          setShowValidation(false);
          return true;
        }}
      />
    </section>
  );
}

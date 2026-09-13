'use client';

import type { UserImportRow } from './user-import-rows';
import { isRowEmpty, rowNeedsFields } from './user-import-rows';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/utils';
import { Eye, EyeOff, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type EditableField =
  | 'email'
  | 'username'
  | 'password'
  | 'displayName'
  | 'group'
  | 'school'
  | 'studentId';

const columns: { key: EditableField; required: boolean }[] = [
  { key: 'email', required: true },
  { key: 'username', required: true },
  { key: 'password', required: true },
  { key: 'displayName', required: false },
  { key: 'group', required: false },
  { key: 'school', required: false },
  { key: 'studentId', required: false },
];

type Props = {
  rows: UserImportRow[];
  lineNumbers: (number | null)[];
  disabled: boolean;
  showPasswords: boolean;
  showValidation: boolean;
  onTogglePasswords: () => void;
  onCellChange: (id: string, field: EditableField, value: string) => void;
  onRemove: (id: string) => void;
};

export default function UserImportTable({
  rows,
  lineNumbers,
  disabled,
  showPasswords,
  showValidation,
  onTogglePasswords,
  onCellChange,
  onRemove,
}: Props) {
  const t = useTranslations('userImport');
  return (
    <div
      className="max-h-105 overflow-auto rounded-lg border"
      data-llm-visible="true"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" aria-label={t('line')}>
              #
            </TableHead>
            {columns.map(({ key, required }) => (
              <TableHead key={key} className="min-w-36">
                <span className="inline-flex items-center gap-1">
                  <span>
                    {t(key)}
                    {required && (
                      <span className="text-destructive" aria-hidden="true">
                        {' '}
                        *
                      </span>
                    )}
                  </span>
                  {key === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        showPasswords ? t('hidePasswords') : t('showPasswords')
                      }
                      onClick={onTogglePasswords}
                    >
                      {showPasswords ? <EyeOff /> : <Eye />}
                    </Button>
                  )}
                </span>
              </TableHead>
            ))}
            <TableHead className="w-12" aria-label={t('removeColumn')} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const missing =
              showValidation && !isRowEmpty(row) && rowNeedsFields(row);
            return (
              <TableRow key={row.id}>
                <TableCell
                  className={cn(
                    'text-muted-foreground text-xs',
                    lineNumbers[index] === null && 'text-transparent'
                  )}
                >
                  {lineNumbers[index] ?? '·'}
                </TableCell>
                {columns.map(({ key, required }) => {
                  const invalid = missing && required && !row[key].trim();
                  return (
                    <TableCell key={key} className="p-1.5">
                      <Input
                        value={row[key]}
                        type={
                          key === 'password' && !showPasswords
                            ? 'password'
                            : 'text'
                        }
                        autoComplete="off"
                        spellCheck={false}
                        disabled={disabled}
                        aria-label={t('rowColumn', {
                          index: index + 1,
                          column: t(key),
                        })}
                        aria-invalid={invalid || undefined}
                        className={cn(
                          'h-8',
                          key === 'password' && 'font-mono',
                          invalid && 'border-destructive'
                        )}
                        onChange={(event) =>
                          onCellChange(row.id, key, event.target.value)
                        }
                      />
                    </TableCell>
                  );
                })}
                <TableCell className="p-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={t('removeRow', { index: index + 1 })}
                    onClick={() => onRemove(row.id)}
                  >
                    <X />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

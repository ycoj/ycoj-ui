'use client';

import UserImportDialog from './user-import-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (text: string) => boolean;
};

export default function PasteDialog({ open, onOpenChange, onApply }: Props) {
  const t = useTranslations('userImport.paste');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const apply = () => {
    if (!text.trim()) {
      setError(t('empty'));
      return false;
    }
    setError('');
    return onApply(text);
  };

  return (
    <UserImportDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      applyLabel={t('apply')}
      error={error}
      onApply={apply}
    >
      <Textarea
        rows={8}
        value={text}
        spellCheck={false}
        autoComplete="off"
        autoFocus
        aria-label={t('title')}
        placeholder={t('placeholder')}
        className="font-mono text-sm"
        onChange={(event) => setText(event.target.value)}
      />
    </UserImportDialog>
  );
}

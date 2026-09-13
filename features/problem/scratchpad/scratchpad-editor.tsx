'use client';

import {
  getClangdStandard,
  getClangdSupport,
  type ClangdStatus,
} from './clangd/clangd-support';
import CodeEditor from '@/shared/components/code/code-editor';
import { Button } from '@/shared/components/ui/button';
import type { OnMount } from '@monaco-editor/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ComponentProps } from 'react';

type Props = ComponentProps<typeof CodeEditor> & {
  clangdEnabled: boolean;
  compilerLanguage: string;
  onDisableClangd: () => void;
};

type MountedEditor = {
  editor: Parameters<OnMount>[0];
  monaco: Parameters<OnMount>[1];
};

export default function ScratchpadEditor({
  clangdEnabled,
  compilerLanguage,
  onDisableClangd,
  ...props
}: Props) {
  const t = useTranslations('problem.scratchpad.clangd');
  const [mounted, setMounted] = useState<MountedEditor>();
  const [status, setStatus] = useState<ClangdStatus>('loading');
  const [support] = useState(getClangdSupport);
  const standard = getClangdStandard(compilerLanguage);

  useEffect(() => {
    if (!clangdEnabled || support !== 'supported' || !standard || !mounted)
      return;
    let active = true;
    let session: { dispose: () => void } | undefined;
    void import('./clangd/clangd-session')
      .then(({ startClangdSession }) => {
        if (!active) return;
        session = startClangdSession(
          mounted.editor,
          mounted.monaco,
          standard,
          setStatus
        );
      })
      .catch(() => {
        if (active) setStatus('failed');
      });
    return () => {
      active = false;
      session?.dispose();
    };
  }, [clangdEnabled, mounted, standard, support]);

  const statusKey = !standard
    ? 'languageUnsupported'
    : support !== 'supported'
      ? support
      : status;
  return (
    <div className="flex h-full min-h-0 flex-col">
      {clangdEnabled && (
        <div className="flex items-center justify-between gap-2 border-b px-3 py-1 text-xs">
          <span role="status">{t(statusKey)}</span>
          <Button size="sm" variant="ghost" onClick={onDisableClangd}>
            {t('disable')}
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <CodeEditor
          {...props}
          onMount={(editor, monaco) => setMounted({ editor, monaco })}
        />
      </div>
    </div>
  );
}

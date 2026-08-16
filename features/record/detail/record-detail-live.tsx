'use client';

import ClientApis from '@/api/client/method';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import AiGenerationLog from '@/features/record/detail/ai-generation/ai-generation-log';
import RecordCode from '@/features/record/detail/record-code';
import { RecordCompilerMessage } from '@/features/record/detail/record-compiler-message';
import RecordDetail from '@/features/record/detail/record-detail';
import RecordSidebar from '@/features/record/detail/record-sidebar';
import { RecordTestcases } from '@/features/record/detail/record-testcases';
import { useRecordSocket } from '@/shared/hooks/use-record-socket';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type Props = {
  rdoc: RecordDoc;
  pdoc: ProblemDoc;
  udoc: User;
  languages: Record<string, LanguageFamily>;
  allowRejudge: boolean;
  allRevs: Record<string, string>;
  selectedRev?: string;
};

type RecordDetailMessage = {
  rdoc: Partial<RecordDoc> & Pick<RecordDoc, '_id'>;
};

function isRecordDetailMessage(
  message: unknown
): message is RecordDetailMessage {
  if (!message || typeof message !== 'object') return false;
  const rdoc = (message as { rdoc?: unknown }).rdoc;
  return (
    !!rdoc &&
    typeof rdoc === 'object' &&
    typeof (rdoc as { _id?: unknown })._id === 'string'
  );
}

export default function RecordDetailLive({
  rdoc: initialRdoc,
  pdoc,
  udoc,
  languages,
  allowRejudge,
  allRevs,
  selectedRev,
}: Props) {
  const [rdoc, setRdoc] = useState(initialRdoc);
  const [lastInitialRdoc, setLastInitialRdoc] = useState(initialRdoc);
  if (lastInitialRdoc !== initialRdoc) {
    setLastInitialRdoc(initialRdoc);
    setRdoc(initialRdoc);
  }
  const router = useRouter();

  const isHistorical = !!selectedRev;

  const { reconnect } = useRecordSocket({
    path: '/record-detail-conn',
    params: {
      domainId: initialRdoc.domainId,
      rid: initialRdoc._id,
    },
    onMessage(message) {
      if (isHistorical) return;
      if (!isRecordDetailMessage(message)) return;
      if (message.rdoc._id !== initialRdoc._id) return;
      setRdoc((current) => ({
        ...current,
        ...message.rdoc,
        code: current.code,
        files: current.files,
        input: current.input,
      }));
    },
  });

  const handleRejudge = useCallback(async () => {
    const result = await ClientApis.Record.rejudge(initialRdoc._id);
    if ('error' in result) throw new Error(result.error.message);
    // 重测会归档出新的历史版本，刷新服务端数据让选择器及时更新
    router.refresh();
    reconnect();
  }, [initialRdoc._id, reconnect, router]);

  const handleCancel = useCallback(async () => {
    const result = await ClientApis.Record.cancel(initialRdoc._id);
    if ('error' in result) throw new Error(result.error.message);
    router.refresh();
  }, [initialRdoc._id, router]);

  const showSidebar =
    (allowRejudge && !isHistorical) || Object.keys(allRevs ?? {}).length > 0;

  if (rdoc.lang === 'ai') {
    return (
      <div className="space-y-6">
        <AiGenerationLog
          rdoc={rdoc}
          pdoc={pdoc}
          udoc={udoc}
          allowCancel={allowRejudge && !isHistorical}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecordDetail rdoc={rdoc} pdoc={pdoc} udoc={udoc} languages={languages} />
      <TwoColumnLayout
        ratio="8-2"
        left={
          <div className="space-y-6">
            {rdoc.code && <RecordCode rdoc={rdoc} />}
            <RecordCompilerMessage rdoc={rdoc} />
            <RecordTestcases rdoc={rdoc} />
          </div>
        }
        right={
          showSidebar ? (
            <RecordSidebar
              allRevs={allRevs}
              selectedRev={selectedRev}
              allowRejudge={allowRejudge}
              onRejudge={handleRejudge}
              onCancel={handleCancel}
            />
          ) : undefined
        }
      />
    </div>
  );
}

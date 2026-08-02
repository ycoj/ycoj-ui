'use client';

import ClientApis from '@/api/client/method';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import RecordCode from '@/features/record/detail/record-code';
import { RecordCompilerMessage } from '@/features/record/detail/record-compiler-message';
import RecordDetail from '@/features/record/detail/record-detail';
import { RecordTestcases } from '@/features/record/detail/record-testcases';
import { useRecordSocket } from '@/shared/hooks/use-record-socket';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';
import { useCallback, useState } from 'react';

type Props = {
  rdoc: RecordDoc;
  pdoc: ProblemDoc;
  udoc: User;
  languages: Record<string, LanguageFamily>;
  allowRejudge: boolean;
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
}: Props) {
  const [rdoc, setRdoc] = useState(initialRdoc);

  const { reconnect } = useRecordSocket({
    path: '/record-detail-conn',
    params: {
      domainId: initialRdoc.domainId,
      rid: initialRdoc._id,
    },
    onMessage(message) {
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
    reconnect();
  }, [initialRdoc._id, reconnect]);

  return (
    <div className="space-y-6">
      <RecordDetail
        rdoc={rdoc}
        pdoc={pdoc}
        udoc={udoc}
        languages={languages}
        allowRejudge={allowRejudge}
        onRejudge={handleRejudge}
      />
      <TwoColumnLayout
        left={
          <div className="space-y-6">
            {rdoc.code && <RecordCode rdoc={rdoc} />}
            <RecordCompilerMessage rdoc={rdoc} />
            <RecordTestcases rdoc={rdoc} />
          </div>
        }
      />
    </div>
  );
}

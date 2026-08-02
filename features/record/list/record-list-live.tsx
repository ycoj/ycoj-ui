'use client';

import type { RecordListResponse } from '@/api/server/method/record/list';
import type { LanguageFamily } from '@/api/server/method/ui/languages';
import RecordList from '@/features/record/list/record-list';
import { useRecordSocket } from '@/shared/hooks/use-record-socket';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordListItem } from '@/shared/types/record';
import type { BaseUser } from '@/shared/types/user';
import { useRef, useState } from 'react';

type Props = {
  data: RecordListResponse;
  languages: Record<string, LanguageFamily>;
  domainId?: string;
};

type RecordListMessage = {
  rdoc: Partial<RecordListItem> & Pick<RecordListItem, '_id'>;
  pdoc: ProblemDoc | null;
  udoc: BaseUser | null;
};

function isRecordListMessage(message: unknown): message is RecordListMessage {
  if (!message || typeof message !== 'object') return false;
  const rdoc = (message as { rdoc?: unknown }).rdoc;
  return (
    !!rdoc &&
    typeof rdoc === 'object' &&
    typeof (rdoc as { _id?: unknown })._id === 'string'
  );
}

export default function RecordListLive({ data, languages, domainId }: Props) {
  const [liveData, setLiveData] = useState(data);
  const initialSize = useRef(data.rdocs.length);
  const rids = useRef(data.rdocs.map((rdoc) => rdoc._id));

  useRecordSocket({
    path: '/record-conn',
    params: {
      domainId,
      tid: data.filterTid,
      pid: data.filterPid,
      uidOrName: data.filterUidOrName,
    },
    onOpen(send) {
      send(JSON.stringify({ rids: rids.current }));
    },
    onMessage(message) {
      if (!isRecordListMessage(message)) return;

      setLiveData((current) => {
        const index = current.rdocs.findIndex(
          (rdoc) => rdoc._id === message.rdoc._id
        );
        if (index < 0 && current.page > 1) return current;

        let rdocs: RecordListItem[];
        if (index >= 0) {
          rdocs = current.rdocs.slice();
          rdocs[index] = { ...rdocs[index], ...message.rdoc };
        } else {
          rdocs = [message.rdoc as RecordListItem, ...current.rdocs];
          if (initialSize.current > 0) {
            rdocs = rdocs.slice(0, initialSize.current);
          }
        }
        rids.current = rdocs.map((rdoc) => rdoc._id);

        return {
          ...current,
          rdocs,
          pdict: message.pdoc
            ? { ...current.pdict, [message.pdoc.docId]: message.pdoc }
            : current.pdict,
          udict: message.udoc
            ? { ...current.udict, [message.udoc._id]: message.udoc }
            : current.udict,
        };
      });
    },
  });

  return <RecordList data={liveData} languages={languages} />;
}

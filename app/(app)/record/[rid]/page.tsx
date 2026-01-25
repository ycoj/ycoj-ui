import ServerApis from '@/api/server/method';
import RecordCode from '@/features/record/detail/record-code';
import { RecordCompilerMessage } from '@/features/record/detail/record-compiler-message';
import RecordDetail from '@/features/record/detail/record-detail';
import { RecordTestcases } from '@/features/record/detail/record-testcases';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import TwoColumnLayout from '@/shared/layout/two-column';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '记录详情',
};

type Props = {
  params: Promise<{
    rid: string;
  }>;
};

export default async function RecordDetailPage({ params }: Props) {
  const rid = (await params).rid;
  const [data, user] = await Promise.all([
    ServerApis.Record.getRecordDetail(rid),
    getUser(),
  ]);
  const languages = await ServerApis.UI.getAvailableLanguages(data.pdoc.docId);
  const allowRejudge = hasPerm(user, PERM.PERM_REJUDGE);
  return (
    <div className="space-y-6">
      <RecordDetail
        rdoc={data.rdoc}
        pdoc={data.pdoc}
        udoc={data.udoc}
        languages={languages.languages}
        allowRejudge={allowRejudge}
      />
      <TwoColumnLayout
        left={
          <div className="space-y-6">
            {data.rdoc.code && <RecordCode rdoc={data.rdoc} />}
            <RecordCompilerMessage rdoc={data.rdoc} />
            {data.rdoc.testCases && <RecordTestcases rdoc={data.rdoc} />}
          </div>
        }
      />
    </div>
  );
}

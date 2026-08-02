import ServerApis from '@/api/server/method';
import RecordDetailLive from '@/features/record/detail/record-detail-live';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return { title: t('recordDetail') };
}

type Props = {
  params: Promise<{
    rid: string;
  }>;
};

export default async function RecordDetailPage({ params }: Props) {
  const rid = (await params).rid;
  const [data, user, languages] = await Promise.all([
    ServerApis.Record.getRecordDetail(rid),
    getUser(),
    ServerApis.UI.getAvailableLanguages(),
  ]);
  const { pdoc, rdoc, udoc } = data;

  const allowRejudge = hasPerm(user, PERM.PERM_REJUDGE);
  return (
    // key 保证在记录之间导航时重置实时状态与连接。
    <RecordDetailLive
      key={rdoc._id}
      rdoc={rdoc}
      pdoc={pdoc}
      udoc={udoc}
      languages={languages.languages}
      allowRejudge={allowRejudge}
    />
  );
}

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
  searchParams: Promise<{
    rev?: string;
  }>;
};

export default async function RecordDetailPage({
  params,
  searchParams,
}: Props) {
  const rid = (await params).rid;
  const rev = (await searchParams).rev;
  const [data, user, languages] = await Promise.all([
    ServerApis.Record.getRecordDetail(rid, rev),
    getUser(),
    ServerApis.UI.getAvailableLanguages(),
  ]);
  const { pdoc, rdoc, udoc, tdoc } = data;

  // 无效 rev 时后端静默回退到最新结果，这里同步忽略它
  const selectedRev = rev && data.allRevs?.[rev] ? rev : undefined;

  const allowRejudge = hasPerm(user, PERM.PERM_REJUDGE);
  return (
    // key 保证在记录或评测版本之间导航时重置实时状态与连接。
    <RecordDetailLive
      key={`${rdoc._id}:${selectedRev ?? 'latest'}`}
      rdoc={rdoc}
      pdoc={pdoc}
      udoc={udoc}
      tdoc={tdoc}
      languages={languages.languages}
      allowRejudge={allowRejudge}
      allRevs={data.allRevs}
      selectedRev={selectedRev}
    />
  );
}

import type { AwardRecord } from '@/shared/types/award';
import { useTranslations } from 'next-intl';

export default function AwardRecords({ records }: { records: AwardRecord[] }) {
  const t = useTranslations('user');
  if (!records.length)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        {t('noCertifiedAwards')}
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-4 py-3">{t('awardContest')}</th>
            <th>{t('awardLevel')}</th>
            <th>{t('awardScore')}</th>
            <th>{t('awardRank')}</th>
            <th>{t('awardSchool')}</th>
            <th>{t('awardProvince')}</th>
            <th>{t('awardGrade')}</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record._id} className="border-b last:border-0">
              <td className="px-4 py-3">{record.contestName}</td>
              <td>{record.award}</td>
              <td>{record.score ?? '-'}</td>
              <td>{record.rank}</td>
              <td>{record.school}</td>
              <td>{record.province}</td>
              <td>{record.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import AccountSettingsForm from './account-settings-form';
import AvatarSettings from './avatar-settings';
import SettingsSidebar from './settings-sidebar';
import TwoColumnLayout from '@/shared/layout/two-column';
import {
  SETTING_FLAG,
  type AccountSettingsData,
} from '@/shared/types/account-settings';
import { useTranslations } from 'next-intl';

type Props = { data: AccountSettingsData };

export default function AccountSettingsPage({ data }: Props) {
  const t = useTranslations('accountSettings');
  const avatar = data.settings.find((setting) => setting.key === 'avatar');

  return (
    <div className="w-full pb-6" data-llm-visible="true">
      <TwoColumnLayout
        ratio="8-2"
        left={
          <div className="min-w-0 space-y-6">
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold" data-llm-text={t('title')}>
                {t('title')}
              </h1>
              <p
                className="text-sm text-muted-foreground"
                data-llm-text={t('description')}
              >
                {t('description')}
              </p>
            </header>
            {!(avatar && avatar.flag & SETTING_FLAG.HIDDEN) && (
              <AvatarSettings
                current={data.current}
                disabled={Boolean(
                  avatar && avatar.flag & SETTING_FLAG.DISABLED
                )}
              />
            )}
            <AccountSettingsForm data={data} />
          </div>
        }
        right={<SettingsSidebar />}
      />
    </div>
  );
}

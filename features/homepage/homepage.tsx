import Banner from './components/banner';
import RecentBlogs from './components/blogs';
import Bulletin from './components/bulletin';
import Contests from './components/contests';
import Countdown from './components/countdown';
import DailyCheckin from './components/daily-checkin';
import Discussions from './components/discussions';
import Suggestions from './components/suggestions';
import ServerApis from '@/api/server/method';
import type { SectionType } from '@/api/server/method/ui/homepage';
import { getUser } from '@/features/user/lib/get-user';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { HomepageCheckin } from '@/shared/types/checkin';
import type { BaseUserDict } from '@/shared/types/user';
import { redirect } from 'next/navigation';

type SectionMap = {
  [K in SectionType[0]]?: Extract<SectionType, [K, unknown]>[1];
};

type ColumnProps = {
  contents: SectionMap;
  udict: BaseUserDict;

  bulletin?: string;
};

type RightColumnProps = ColumnProps & {
  checkin: HomepageCheckin;
  username: string;
};

async function LeftColumn({ contents, udict, bulletin }: ColumnProps) {
  return (
    <div className="space-y-6">
      {contents.banner && (
        <div className="hidden md:block">
          <Banner banner={contents.banner} />
        </div>
      )}
      <Bulletin bulletin={bulletin} />
      {contents.contest && <Contests contests={contents.contest[0]} />}
      {contents.discussion && (
        <Discussions discussions={contents.discussion[0]} udict={udict} />
      )}
    </div>
  );
}

async function RightColumn({
  contents,
  udict,
  checkin,
  username,
}: RightColumnProps) {
  return (
    <div className="space-y-6">
      <DailyCheckin checkin={checkin} username={username} />
      {contents.countdown && <Countdown config={contents.countdown} />}
      {contents.suggestions && <Suggestions sections={contents.suggestions} />}
      {contents.recent_blogs && (
        <RecentBlogs blogs={contents.recent_blogs} udict={udict} />
      )}
    </div>
  );
}

export default async function Homepage() {
  const [homepage, user] = await Promise.all([
    ServerApis.UI.getHomepage(),
    getUser(),
  ]);
  if (!user?._id) redirect('/login');

  const contents = homepage.contents
    .flatMap((content) => content.sections)
    .reduce<SectionMap>((acc, [key, section]) => {
      return {
        ...acc,
        [key]: section,
      };
    }, {});
  const udict = homepage.udict;

  return (
    <TwoColumnLayout
      left={
        <LeftColumn
          contents={contents}
          udict={udict}
          bulletin={homepage.domain.bulletin}
        />
      }
      right={
        <RightColumn
          contents={contents}
          udict={udict}
          checkin={homepage.checkin}
          username={user.uname}
        />
      }
    />
  );
}

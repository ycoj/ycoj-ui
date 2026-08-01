import { alova } from '@/api/server';
import type { Blog } from '@/shared/types/blog';
import type { HomepageCheckin } from '@/shared/types/checkin';
import type { Contest as ContestDoc } from '@/shared/types/contest';
import type {
  Discussion as DiscussionDoc,
  Node,
} from '@/shared/types/discussion';
import type { DomainDoc } from '@/shared/types/domain';
import type { BaseUserDict } from '@/shared/types/user';

export type BannerConfig = {
  max_width?: string;
  pictures: {
    /** 图片 URL */
    src: string;
    /** 点击图片跳转的链接 */
    link: string;
  }[];
};
export type Banner = ['banner', BannerConfig];

export type Bulletin = ['bulletin', boolean];
export type Contest = ['contest', [ContestDoc[], unknown]];
export type Hitokoto = ['hitokoto', boolean];
export type Discussion = ['discussion', [DiscussionDoc[], Node[]]];
export type StarredProblems = ['starred_problems', number];
export type RecentBlogs = ['recent_blogs', Blog[]];
export type DiscussionNodes = ['discussion_nodes', boolean];

export type SuggestionSite = {
  link: string;
  title: string;
};
export type SuggestionSection = {
  title: string;
  sites: SuggestionSite[];
};
export type Suggestions = ['suggestions', SuggestionSection[]];

export type CountdownEvent = {
  name: string;
  date: string;
  /** 事件持续天数 */
  duration: number;
};
export type CountdownConfig = {
  events: CountdownEvent[];
  startDate: string;
};
export type Countdown = ['countdown', CountdownConfig];

export type SectionType =
  | Banner
  | Bulletin
  | Contest
  | Hitokoto
  | Discussion
  | StarredProblems
  | RecentBlogs
  | DiscussionNodes
  | Suggestions
  | Countdown;

export type Content = {
  width: number;
  sections: [string, SectionType][];
};

export type HomepageResponse = {
  checkin: HomepageCheckin;
  bulletin: string;
  contents: Content[];
  udict: BaseUserDict;
  domain: DomainDoc;
};

export const getHomepage = () => alova.Get<HomepageResponse>('/');

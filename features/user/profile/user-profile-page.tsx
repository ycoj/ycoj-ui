import BioSection from './components/bio-section';
import CoreStats from './components/core-stats';
import HeaderSection from './components/header-section';
import ParticipationSummary from './components/participation-summary';
import ProblemSummary from './components/problem-summary';
import SolutionSummary from './components/solution-summary';
import type { UserDetailResponse } from '@/api/server/method/user/detail';

type Props = {
  data: UserDetailResponse;
};

export default function UserProfilePage({ data }: Props) {
  return (
    <div className="space-y-6" data-llm-visible="true">
      <HeaderSection data={data} />
      <BioSection data={data} />
      <CoreStats data={data} />
      <ProblemSummary data={data} />
      <ParticipationSummary data={data} />
      <SolutionSummary data={data} />
    </div>
  );
}

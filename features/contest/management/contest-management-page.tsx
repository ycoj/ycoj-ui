import ContestManagementClient, {
  type ContestManagementClientProps,
} from './contest-management-client';
import ContestManagementSidebar from './contest-management-sidebar';
import TwoColumnLayout from '@/shared/layout/two-column';
import type { BaseUser } from '@/shared/types/user';

type Props = ContestManagementClientProps & {
  owner?: BaseUser;
};

export default function ContestManagementPage(props: Props) {
  const { owner, ...clientProps } = props;
  return (
    <TwoColumnLayout
      ratio="8-2"
      left={<ContestManagementClient {...clientProps} />}
      right={
        <ContestManagementSidebar
          tid={clientProps.tid}
          contest={clientProps.data.tdoc}
          owner={owner}
        />
      }
    />
  );
}

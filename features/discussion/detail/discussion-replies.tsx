import DiscussionRepliesClient from '@/features/discussion/detail/discussion-replies-client';
import { getUser } from '@/features/user/lib/get-user';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { DiscussionReplyDoc } from '@/shared/types/discussion';
import type { BaseUser, BaseUserDict } from '@/shared/types/user';

type Props = {
  did: string;
  drdocs: DiscussionReplyDoc[];
  udict: BaseUserDict;
  page: number;
  pcount: number;
  drcount: number;
};

export default async function DiscussionReplies({
  did,
  drdocs,
  udict,
  page,
  pcount,
  drcount,
}: Props) {
  const user = await getUser();
  const canReply = !!user?._id && hasPerm(user, PERM.PERM_REPLY_DISCUSSION);
  const currentUser: BaseUser | null = user
    ? {
        _id: user._id,
        uname: user.uname,
        mail: user.mail,
        avatar: user.avatar,
      }
    : null;

  return (
    <DiscussionRepliesClient
      did={did}
      drdocs={drdocs}
      udict={udict}
      page={page}
      pcount={pcount}
      drcount={drcount}
      currentUser={currentUser}
      canReply={canReply}
    />
  );
}

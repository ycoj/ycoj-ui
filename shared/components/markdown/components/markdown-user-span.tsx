import UserSpan from '@/features/user/user-span';

function getPropValue(
  props: Record<string, unknown>,
  kebabName: string,
  camelName: string
): unknown {
  return props[kebabName] ?? props[camelName];
}

type Props = Record<string, unknown>;

export default function MarkdownUserSpan(props: Props) {
  const uidRaw = getPropValue(props, 'data-uid', 'dataUid');
  const unameRaw = getPropValue(props, 'data-uname', 'dataUname');
  const mailRaw = getPropValue(props, 'data-mail', 'dataMail');
  const avatarRaw = getPropValue(props, 'data-avatar', 'dataAvatar');

  const uid =
    typeof uidRaw === 'string' && /^\d+$/.test(uidRaw)
      ? Number.parseInt(uidRaw, 10)
      : NaN;

  if (
    !Number.isInteger(uid) ||
    typeof unameRaw !== 'string' ||
    typeof mailRaw !== 'string' ||
    typeof avatarRaw !== 'string'
  ) {
    return null;
  }

  return (
    <UserSpan
      user={{
        _id: uid,
        uname: unameRaw,
        mail: mailRaw,
        avatar: avatarRaw,
      }}
      showAvatar={false}
    />
  );
}

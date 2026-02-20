import type { UserDetailResponse } from '@/api/server/method/user/detail';
import type { BaseUser } from '@/shared/types/user';
import dayjs from 'dayjs';

export type UserProfileProps = {
  data: UserDetailResponse;
};

export type ProfileExtras = {
  avatar?: string;
  bio?: string;
  rp?: number;
  nAccept?: number;
  nSubmit?: number;
};

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const formatted = dayjs(value);
  return formatted.isValid() ? formatted.format('YYYY-MM-DD HH:mm') : '-';
}

function readStringField(source: object, key: string): string | undefined {
  const value = (source as Record<string, unknown>)[key];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readNumberField(source: object, key: string): number | undefined {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function getProfileExtras(data: UserDetailResponse): ProfileExtras {
  return {
    avatar: readStringField(data.udoc, 'avatar'),
    bio: readStringField(data.udoc, 'bio'),
    rp: readNumberField(data.udoc, 'rp'),
    nAccept: readNumberField(data.udoc, 'nAccept'),
    nSubmit: readNumberField(data.udoc, 'nSubmit'),
  };
}

export function getProfileUser(data: UserDetailResponse): BaseUser {
  const extras = getProfileExtras(data);

  return {
    _id: data.udoc._id,
    uname: data.udoc.uname,
    mail: data.udoc.mail,
    avatar: extras.avatar ?? '',
  };
}

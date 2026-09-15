import {
  canImportUsers,
  canManageExpiration,
  manageLanding,
} from './manage-access';
import { describe, expect, it } from 'vitest';

describe('management access', () => {
  it.each([
    { priv: -1, path: '/manage/realname', allowed: true },
    { priv: 5, path: '/manage/user-import', allowed: true },
    { priv: 4, path: '/home', allowed: false },
  ])('routes privilege $priv correctly', ({ priv, path, allowed }) => {
    expect(canManageExpiration({ priv })).toBe(allowed);
    expect(canImportUsers({ priv })).toBe(allowed);
    expect(manageLanding({ priv })).toBe(path);
  });
});

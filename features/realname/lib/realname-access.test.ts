import { getRealnameAccess, REALNAME_GRACE_MS } from './realname-access';
import { PRIV } from '@/features/user/lib/priv';
import { describe, expect, it } from 'vitest';

const submittedAt = '2026-08-01T00:00:00.000Z';
const beforeDeadline = new Date(
  new Date(submittedAt).getTime() + REALNAME_GRACE_MS - 1
);
const atDeadline = new Date(
  new Date(submittedAt).getTime() + REALNAME_GRACE_MS
);

describe('getRealnameAccess', () => {
  it('sends users without an application to the submission page', () => {
    expect(
      getRealnameAccess({ priv: 0, realnameStatus: 'none' }, beforeDeadline)
    ).toMatchObject({
      allowed: false,
      inGrace: false,
      redirectTo: '/home/realname',
    });
  });

  it('allows pending and rejected users before the deadline', () => {
    for (const realnameStatus of ['pending', 'rejected'] as const) {
      expect(
        getRealnameAccess(
          { priv: 0, realnameStatus, realnameSubmittedAt: submittedAt },
          beforeDeadline
        )
      ).toMatchObject({ allowed: true, inGrace: true, redirectTo: null });
    }
  });

  it('blocks pending and rejected users at the exact deadline', () => {
    for (const realnameStatus of ['pending', 'rejected'] as const) {
      expect(
        getRealnameAccess(
          { priv: 0, realnameStatus, realnameSubmittedAt: submittedAt },
          atDeadline
        )
      ).toMatchObject({
        allowed: false,
        inGrace: false,
        redirectTo: '/home/realname/result',
      });
    }
  });

  it('allows approved, super-admin, and judge accounts', () => {
    expect(
      getRealnameAccess({ priv: 0, realnameStatus: 'approved' }, atDeadline)
    ).toMatchObject({ allowed: true, exempt: false });
    expect(
      getRealnameAccess(
        { priv: PRIV.PRIV_ALL, realnameStatus: 'none' },
        atDeadline
      )
    ).toMatchObject({ allowed: true, exempt: true });
    expect(
      getRealnameAccess(
        { priv: PRIV.PRIV_JUDGE, realnameStatus: 'none' },
        atDeadline
      )
    ).toMatchObject({ allowed: true, exempt: true });
  });

  it('does not restart grace when a rejected user has an old first submission', () => {
    expect(
      getRealnameAccess(
        {
          priv: 0,
          realnameStatus: 'rejected',
          realnameSubmittedAt: submittedAt,
        },
        atDeadline
      )
    ).toMatchObject({ allowed: false, inGrace: false });
  });
});

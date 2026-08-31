import Paste from './index';
import { normalizePasteOptionsResponse } from './normalize';
import { alova } from '@/api/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server', () => ({ alova: { Get: vi.fn() } }));

describe('paste read contracts', () => {
  it('uses the owner list endpoint with a page query', () => {
    Paste.getPasteMain(2);
    expect(alova.Get).toHaveBeenLastCalledWith('/paste', {
      params: { page: 2 },
      transform: expect.any(Function),
    });
  });

  it('loads detail and the permission-checked edit endpoint separately', () => {
    Paste.getPasteDetail('abc123');
    expect(alova.Get).toHaveBeenLastCalledWith('/paste/abc123');
    Paste.getPasteEdit('abc123');
    expect(alova.Get).toHaveBeenLastCalledWith('/paste/abc123/edit', {
      transform: expect.any(Function),
    });
  });
});

describe('normalizePasteOptionsResponse', () => {
  it('renames language options and drops unused expiry labels', () => {
    expect(
      normalizePasteOptionsResponse({
        expiryOptions: {
          day: '1 day',
          week: '1 week',
          month: '1 month',
          never: 'Never',
        },
        languageOptions: { cpp: 'C++' },
        defaultExpire: 'month',
        defaultLanguage: 'cpp',
        pdocs: [],
        page: 1,
        ppcount: 0,
        pcount: 0,
      })
    ).toEqual({
      languageNames: { cpp: 'C++' },
      defaultExpire: 'month',
      defaultLanguage: 'cpp',
      pdocs: [],
      page: 1,
      ppcount: 0,
      pcount: 0,
    });
  });

  it('passes backend errors through', () => {
    const error = { error: { name: 'ForbiddenError', message: 'denied' } };
    expect(normalizePasteOptionsResponse(error)).toBe(error);
  });
});

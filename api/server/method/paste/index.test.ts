import Paste from './index';
import { alova } from '@/api/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server', () => ({ alova: { Get: vi.fn() } }));

describe('paste read contracts', () => {
  it('uses the owner list endpoint with a page query', () => {
    Paste.getPasteMain(2);
    expect(alova.Get).toHaveBeenLastCalledWith('/paste', {
      params: { page: 2 },
    });
  });

  it('loads detail and the permission-checked edit endpoint separately', () => {
    Paste.getPasteDetail('abc123');
    expect(alova.Get).toHaveBeenLastCalledWith('/paste/abc123');
    Paste.getPasteEdit('abc123');
    expect(alova.Get).toHaveBeenLastCalledWith('/paste/abc123/edit');
  });
});

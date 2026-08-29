import { getMessages } from './list';
import { alova } from '@/api/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server', () => ({
  alova: {
    Get: vi.fn((url: string) => ({ url })),
  },
}));

describe('getMessages', () => {
  it('loads the legacy messages endpoint', () => {
    expect(getMessages()).toEqual({ url: '/home/messages' });
    expect(alova.Get).toHaveBeenCalledWith('/home/messages');
  });
});

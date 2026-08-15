import { getProblemConfig } from './config';
import { alova } from '@/api/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server', () => ({
  alova: {
    Get: vi.fn((url: string) => ({ url })),
  },
}));

describe('getProblemConfig', () => {
  it('loads the backend configuration route', () => {
    expect(getProblemConfig('P1000')).toEqual({ url: '/p/P1000/config' });
    expect(alova.Get).toHaveBeenCalledWith('/p/P1000/config');
  });
});

import { getAiGenerationOptions } from './ai-generation';
import { alova } from '@/api/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/server', () => ({
  alova: {
    Get: vi.fn((url: string) => ({ url })),
  },
}));

describe('getAiGenerationOptions', () => {
  it('gets generation options from the problem route', () => {
    expect(getAiGenerationOptions('P1000')).toEqual({
      url: '/p/P1000/generate',
    });
    expect(alova.Get).toHaveBeenCalledTimes(1);
  });
});

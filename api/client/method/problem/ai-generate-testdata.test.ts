import { generateAiTestdata } from './ai-generate-testdata';
import { describe, expect, it } from 'vitest';

describe('generateAiTestdata', () => {
  it('uses the generic API mutation and nests parameters under args', () => {
    const request = generateAiTestdata({
      domainId: 'system',
      id: 'P1000',
      instructions: 'Add adversarial chain cases',
    });

    expect(request.url).toBe('/api/problem.aiGenerateTestdata');
    expect(request.data).toEqual({
      args: {
        domainId: 'system',
        id: 'P1000',
        instructions: 'Add adversarial chain cases',
      },
    });
  });
});

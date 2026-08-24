import { generateAiTestdata } from './ai-generate-testdata';
import { describe, expect, it } from 'vitest';

describe('generateAiTestdata', () => {
  it('posts the generation payload to the problem route', () => {
    const request = generateAiTestdata('P1000', {
      profileId: 'quality',
      testcaseTarget: 20,
      timeLimitMs: 1500,
      memoryLimitMb: 512,
      instructions: 'Add adversarial chain cases',
      standardSolution: { source: 'int main() {}' },
      checker: { mode: 'generated', requirements: 'Accept any valid path.' },
    });

    expect(request.url).toBe('/p/P1000/generate');
    expect(request.data).toEqual({
      profileId: 'quality',
      testcaseTarget: 20,
      timeLimitMs: 1500,
      memoryLimitMb: 512,
      instructions: 'Add adversarial chain cases',
      standardSolution: { source: 'int main() {}' },
      checker: {
        mode: 'generated',
        requirements: 'Accept any valid path.',
      },
    });
  });
});

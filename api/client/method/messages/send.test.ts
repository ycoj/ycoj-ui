import { sendMessage } from './send';
import { describe, expect, it } from 'vitest';

describe('sendMessage', () => {
  it('uses the legacy message operation and pure text payload', () => {
    const request = sendMessage(42, 'hello\nworld');

    expect(request.url).toBe('/home/messages');
    expect(request.data).toEqual({
      operation: 'send',
      uid: 42,
      content: 'hello\nworld',
    });
  });
});

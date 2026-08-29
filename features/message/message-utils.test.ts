import {
  appendMessage,
  formatMessageContent,
  messageSummary,
  objectIdTimestamp,
  parseMessageTarget,
  sortDialogues,
  sortMessages,
} from './message-utils';
import { MessageFlag, type MessageDoc } from '@/shared/types/message';
import { describe, expect, it } from 'vitest';

const older: MessageDoc = {
  _id: '65a000000000000000000001',
  from: 2,
  to: 3,
  content: 'older',
  flag: 0,
};
const newer: MessageDoc = {
  ...older,
  _id: '65a000010000000000000001',
  content: 'newer',
};

describe('message utilities', () => {
  it('derives timestamps and orders conversations from Mongo object ids', () => {
    expect(objectIdTimestamp(older._id)).toBe(0x65a00000 * 1_000);
    expect(sortMessages([newer, older])).toEqual([older, newer]);
    expect(
      sortDialogues([
        { _id: 2, udoc: { _id: 2, uname: 'older' }, messages: [older] },
        { _id: 3, udoc: { _id: 3, uname: 'newer' }, messages: [newer] },
      ]).map(({ _id }) => _id)
    ).toEqual([3, 2]);
  });

  it('deduplicates realtime messages by id', () => {
    expect(appendMessage([older], older)).toEqual([older]);
    expect(appendMessage([older], newer)).toEqual([older, newer]);
  });

  it('reads both supported conversation parameters', () => {
    expect(parseMessageTarget(new URLSearchParams('target=42'))).toBe(42);
    expect(parseMessageTarget(new URLSearchParams('uid=7'))).toBe(7);
    expect(parseMessageTarget(new URLSearchParams('target=-1'))).toBeNull();
    expect(parseMessageTarget(new URLSearchParams('uid=text'))).toBeNull();
  });

  it('formats known system messages and safely falls back to their source key', () => {
    const systemMessage: MessageDoc = {
      ...older,
      from: 1,
      content: JSON.stringify({
        message: 'Judge Result\n{0}: {1}',
        params: ['A + B', 'Accepted'],
      }),
      flag: MessageFlag.i18n,
    };
    expect(formatMessageContent(systemMessage, 'zh').text).toBe(
      '评测结果\nA + B: Accepted'
    );
    expect(
      formatMessageContent(
        {
          ...systemMessage,
          content: JSON.stringify({ message: 'Unknown {0}', params: ['key'] }),
        },
        'en'
      ).text
    ).toBe('Unknown key');
    expect(
      messageSummary({ ...systemMessage, flag: MessageFlag.richtext }, 'en')
    ).toBe('[Rich text message]');
  });
});

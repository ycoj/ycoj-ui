import oid2ts, { mockObjectId } from './oid2ts';
import { describe, expect, it } from 'vitest';

describe('oid2ts', () => {
  it('converts ObjectId timestamp prefix to milliseconds', () => {
    // 0x65a1bc00 seconds → ms
    expect(oid2ts('65a1bc00abcdef0123456789')).toBe(0x65a1bc00 * 1000);
  });

  it('handles zero timestamp prefix', () => {
    expect(oid2ts('00000000abcdef0123456789')).toBe(0);
  });
});

describe('mockObjectId', () => {
  it('returns 8-character uppercase hex for a fixed timestamp', () => {
    expect(mockObjectId(0x65a1bc00 * 1000)).toBe('65A1BC00');
  });

  it('pads short hex prefixes', () => {
    expect(mockObjectId(1 * 1000)).toBe('00000001');
  });

  it('round-trips with oid2ts', () => {
    const ts = 1_700_000_000_000;
    const prefix = mockObjectId(ts);
    expect(oid2ts(`${prefix}0000000000000000`)).toBe(
      Math.round(ts / 1000) * 1000
    );
  });
});

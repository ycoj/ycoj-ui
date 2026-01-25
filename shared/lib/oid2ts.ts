import { ObjectId } from '../types/shared';

/**
 * Converts a MongoDB ObjectId to a timestamp in milliseconds
 * @param oid - MongoDB ObjectId string (24 hex characters)
 * @returns Timestamp in milliseconds
 */
export default function oid2ts(oid: ObjectId): number {
  return parseInt(oid.substring(0, 8), 16) * 1000;
}

/**
 * Generates a mock ObjectId timestamp prefix from a timestamp
 * @param ts - Timestamp in milliseconds, defaults to current time
 * @returns 8-character uppercase hex string representing the timestamp
 */
export function mockObjectId(ts: number = Date.now()): string {
  return Math.round(ts / 1000)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
}

import { formatMemory, formatTime } from './format-units';
import { bench, describe } from 'vitest';

// A record list page renders time/memory for every submission row.
const RECORD_COUNT = 500;

const times = Array.from(
  { length: RECORD_COUNT },
  (_, index) => index * 137 + (index % 7) * 999
);
const memories = Array.from(
  { length: RECORD_COUNT },
  (_, index) => index * 65_536 + (index % 11) * 1024
);

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('format-units', () => {
  bench('formatTime - auto unit over a record list', () => {
    let total = 0;
    for (const time of times) total += formatTime(time).length;
    sink.value = total;
  });

  bench('formatTime - fixed units', () => {
    let total = 0;
    for (const time of times) {
      total += formatTime(time, 'ms').length;
      total += formatTime(time, 's').length;
      total += formatTime(time, 'min').length;
    }
    sink.value = total;
  });

  bench('formatMemory - auto unit over a record list', () => {
    let total = 0;
    for (const memory of memories) total += formatMemory(memory).length;
    sink.value = total;
  });

  bench('formatMemory - fixed units', () => {
    let total = 0;
    for (const memory of memories) {
      total += formatMemory(memory, 'B').length;
      total += formatMemory(memory, 'KiB').length;
      total += formatMemory(memory, 'MiB').length;
      total += formatMemory(memory, 'GiB').length;
    }
    sink.value = total;
  });
});

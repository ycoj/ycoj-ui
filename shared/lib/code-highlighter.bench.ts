import { highlightCodeToHtml } from '@/shared/lib/code-highlighter';
import { bench, describe } from 'vitest';

function makeCppSource(lineCount: number) {
  return Array.from({ length: lineCount }, (_, index) => {
    switch (index % 5) {
      case 0:
        return `std::vector<int> values_${index}(128, ${index});`;
      case 1:
        return `for (int i = 0; i < ${index + 128}; ++i) total += i * i;`;
      case 2:
        return `if (total > ${index}) throw std::runtime_error("limit ${index}");`;
      case 3:
        return `auto result_${index} = solve(values, ${index}); // candidate`;
      default:
        return `std::cout << "case ${index}: " << result << '\\n';`;
    }
  }).join('\n');
}

const cpp1k = makeCppSource(1_000);
const cpp10k = makeCppSource(10_000);

const sink: { value: unknown } = { value: undefined };

describe('highlightCodeToHtml', () => {
  bench('C++ source - 1,000 lines', () => {
    sink.value = highlightCodeToHtml(cpp1k, 'cpp');
  });

  bench('C++ source - 10,000 lines', () => {
    sink.value = highlightCodeToHtml(cpp10k, 'cpp');
  });
});

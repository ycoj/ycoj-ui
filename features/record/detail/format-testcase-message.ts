import type { TestCaseResponse } from '@/shared/types/record';

export function formatTestcaseMessage(message: TestCaseResponse['message']) {
  if (typeof message === 'string') {
    return message;
  }

  return message.message.replace(/{(\d+)}/g, (placeholder, index) => {
    const param = message.params?.[Number(index)];
    return param === undefined ? placeholder : String(param);
  });
}

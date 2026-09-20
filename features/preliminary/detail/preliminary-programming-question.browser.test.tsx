import PreliminaryProgrammingQuestion from './preliminary-programming-question';
import messages from '@/messages/en';
import type { PublicProjectionProblem } from '@/shared/types/problem';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  submitProblem: vi.fn(),
  getFullList: vi.fn(),
  setProgrammingAnswer: vi.fn(),
  socketMessage: undefined as ((message: unknown) => void) | undefined,
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Problem: { submitProblem: mocks.submitProblem },
    Record: { getFullList: mocks.getFullList },
  },
}));

vi.mock('@/features/preliminary/detail/preliminary-answer-provider', () => ({
  usePreliminaryAnswers: () => {
    const [programmingAnswers, setProgrammingAnswers] = useState<
      Record<string, { lang: string; code: string }>
    >({});
    return {
      programmingAnswers,
      setProgrammingAnswer: (
        id: string,
        answer: { lang: string; code: string }
      ) => {
        mocks.setProgrammingAnswer(id, answer);
        setProgrammingAnswers((current) => ({ ...current, [id]: answer }));
      },
      isReady: true,
    };
  },
}));

vi.mock('@/features/problem/scratchpad/scratchpad-editor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock('@/features/problem/scratchpad/scratchpad-records', () => ({
  default: ({
    records,
  }: {
    records: Array<{ _id: string; score: number }>;
  }) => (
    <div>
      {records.map((record) => (
        <div key={record._id}>{`score ${record.score}`}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/shared/hooks/use-record-socket', () => ({
  useRecordSocket: ({
    onMessage,
  }: {
    onMessage: (message: unknown) => void;
  }) => {
    mocks.socketMessage = onMessage;
  },
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

const problem = {
  _id: 'problem-object-id',
  domainId: 'system',
  docType: 10,
  docId: 1001,
  pid: 'P1001',
  owner: 1,
  title: 'A + B',
  content: 'Read two integers.',
  nSubmit: 0,
  nAccept: 0,
  tag: [],
  data: [],
  config: {
    type: 'default',
    count: 1,
    memoryMax: 64,
    memoryMin: 64,
    timeMax: 1000,
    timeMin: 1000,
  },
} as PublicProjectionProblem;

const question = {
  id: 'programming-1',
  type: 'programming' as const,
  prompt: '',
  score: 10,
  pid: 1001,
  multiplier: 1,
  languages: [],
};

function renderQuestion() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PreliminaryProgrammingQuestion
        question={question}
        problem={problem}
        statement={<div>Read two integers.</div>}
        languages={{
          cc: {
            display: 'C++',
            versions: [{ name: 'cc.cc17o2', display: 'C++ 17' }],
          },
        }}
        user={{
          _id: 2,
          uname: 'user',
          mail: '',
          avatar: '',
          perm: 'BigInt::0',
          role: 'default',
          priv: 0,
          regat: '',
          loginat: '',
          tfa: false,
          authn: false,
        }}
        isReadOnly={false}
      />
    </NextIntlClientProvider>
  );
}

describe('PreliminaryProgrammingQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.socketMessage = undefined;
    mocks.getFullList.mockReturnValue({
      send: vi.fn().mockResolvedValue({ rdocs: [] }),
    });
    mocks.submitProblem.mockReturnValue({
      send: vi.fn().mockResolvedValue({ rid: 'record-1' }),
    });
  });

  it('edits code, submits it, and renders a live judged result', async () => {
    const user = userEvent.setup();
    renderQuestion();

    const editor = screen.getByRole('textbox', { name: 'Code' });
    await act(async () => {
      fireEvent.change(editor, { target: { value: 'int main() {}' } });
    });
    expect(mocks.setProgrammingAnswer).toHaveBeenCalledWith('programming-1', {
      lang: 'cc.cc17o2',
      code: 'int main() {}',
    });

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(mocks.submitProblem).toHaveBeenCalledWith('P1001', {
      lang: 'cc.cc17o2',
      code: 'int main() {}',
    });

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Submitted')
    );
    await waitFor(() => expect(mocks.socketMessage).toBeDefined());
    await act(async () => {
      mocks.socketMessage?.({
        rdoc: {
          _id: 'record-1',
          domainId: 'system',
          pid: 1001,
          uid: 2,
          lang: 'cc.cc17o2',
          score: 100,
          memory: 1024,
          time: 5,
          status: 1,
          compilerTexts: [],
          testCases: [],
        },
      });
    });
    expect(await screen.findByText('score 100')).toBeInTheDocument();
  });
});

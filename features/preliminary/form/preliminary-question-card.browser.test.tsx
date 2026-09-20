import type { PreliminaryFormValues } from './preliminary-form-utils';
import PreliminaryQuestionCard from './preliminary-question-card';
import messages from '@/messages/en';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  searchProblems: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: { Problem: { searchProblems: mocks.searchProblems } },
}));

function ProgrammingQuestionHarness() {
  const methods = useForm<PreliminaryFormValues>({
    defaultValues: {
      title: '',
      content: '',
      sections: [
        {
          id: 'section-1',
          type: 'programming',
          title: 'Programming',
          content: '',
          questions: [
            {
              id: 'question-1',
              type: 'programming',
              prompt: '',
              score: 2,
              explanation: '',
              answer: '',
              options: [],
              multiplier: 1,
              languages: '',
            },
          ],
        },
      ],
    },
  });

  return (
    <FormProvider {...methods}>
      <PreliminaryQuestionCard
        sectionIndex={0}
        questionIndex={0}
        onMoveQuestion={vi.fn()}
        onRemoveQuestion={vi.fn()}
      />
    </FormProvider>
  );
}

describe('PreliminaryQuestionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.searchProblems.mockReturnValue({
      send: vi.fn().mockResolvedValue({
        pdocs: [{ docId: 1000, pid: 'P1000', title: 'Binary Tree' }],
      }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    mocks.searchProblems.mockReset();
  });

  it('searches programming problems by title', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProgrammingQuestionHarness />
      </NextIntlClientProvider>
    );

    const input = screen.getByRole('combobox', {
      name: messages.preliminaryForm.problem,
    });
    fireEvent.change(input, { target: { value: 'tree' } });

    expect(input).toHaveValue('tree');

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.searchProblems).toHaveBeenCalledWith('system', 'tree');
    expect(screen.getByText('P1000 Binary Tree')).toBeVisible();
  });
});

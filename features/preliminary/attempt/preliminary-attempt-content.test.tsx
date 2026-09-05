import PreliminaryAttemptContent, {
  isCorrectOption,
} from './preliminary-attempt-content';
import type {
  PreliminaryAttemptData,
  PreliminaryReviewQuestion,
} from '@/api/server/method/preliminary/attempt';
import messages from '@/messages/en.json';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

// The shared Markdown renderer is async (MarkdownAsync) and suspends the
// whole tree in tests; stub it so the review highlighting stays synchronous.
vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

function choiceQuestion(
  overrides: Partial<PreliminaryReviewQuestion> = {}
): PreliminaryReviewQuestion {
  return {
    id: 'q1',
    type: 'choice',
    prompt: 'Which one?',
    score: 5,
    options: [
      { id: 'o1', text: 'Alpha' },
      { id: 'o2', text: 'Beta' },
    ],
    result: { questionId: 'q1', correct: false, score: 0, maxScore: 5 },
    ...overrides,
  };
}

function dataWith(question: PreliminaryReviewQuestion): PreliminaryAttemptData {
  return {
    attempt: {
      docId: 'a1',
      paperId: 'p1',
      parentId: 'p1',
      parentType: 90,
      revisionId: 'r1',
      revision: 2,
      owner: 1,
      answers: {},
      results: [question.result],
      score: question.result.score,
      totalScore: 5,
      submittedAt: '2026-09-05T00:00:00.000Z',
    },
    paper: {
      docId: 'p1',
      title: 'Paper',
      content: '',
      revision: 2,
      sections: [
        {
          id: 's1',
          type: 'single_choice',
          title: 'Choice',
          content: '',
          questions: [question],
        },
      ],
    },
  };
}

function renderContent(data: PreliminaryAttemptData) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <PreliminaryAttemptContent data={data} />
    </NextIntlClientProvider>
  );
}

async function renderedOptionStates(data: PreliminaryAttemptData) {
  const { container } = renderContent(data);
  await screen.findByText('Alpha');
  await screen.findByText('Beta');
  return optionStates(container);
}

function optionStates(container: HTMLElement) {
  return Array.from(container.querySelectorAll('div'))
    .filter((el) => el.className.includes('flex items-start gap-3'))
    .map((el) => ({
      text: el.textContent ?? '',
      correct: el.className.includes('border-green-500'),
      wrong: el.className.includes('border-red-500'),
    }));
}

describe('isCorrectOption', () => {
  it('uses the user answer when the result is correct', () => {
    const question = choiceQuestion({
      result: {
        questionId: 'q1',
        answer: 'o1',
        correct: true,
        score: 5,
        maxScore: 5,
      },
    });
    expect(isCorrectOption(question, 'o1')).toBe(true);
    expect(isCorrectOption(question, 'o2')).toBe(false);
  });

  it('uses the correct answer key when the result is incorrect', () => {
    const question = choiceQuestion({
      result: {
        questionId: 'q1',
        answer: 'o1',
        correct: false,
        score: 0,
        maxScore: 5,
      },
      correctAnswer: 'o2',
    });
    expect(isCorrectOption(question, 'o2')).toBe(true);
    expect(isCorrectOption(question, 'o1')).toBe(false);
  });

  it('uses the correct answer key when unanswered', () => {
    const question = choiceQuestion({
      result: { questionId: 'q1', correct: false, score: 0, maxScore: 5 },
      correctAnswer: 'o2',
    });
    expect(isCorrectOption(question, 'o2')).toBe(true);
    expect(isCorrectOption(question, 'o1')).toBe(false);
  });

  it('covers true/false questions without a correctAnswer key', () => {
    const question: PreliminaryReviewQuestion = {
      id: 'q1',
      type: 'true_false',
      prompt: 'Is it true?',
      score: 2,
      result: {
        questionId: 'q1',
        answer: 'true',
        correct: true,
        score: 2,
        maxScore: 2,
      },
    };
    expect(isCorrectOption(question, 'true')).toBe(true);
    expect(isCorrectOption(question, 'false')).toBe(false);
  });
});

describe('PreliminaryAttemptContent review highlighting', () => {
  it('highlights the user answer green for a correct question without a correctAnswer key', async () => {
    const states = await renderedOptionStates(
      dataWith(
        choiceQuestion({
          result: {
            questionId: 'q1',
            answer: 'o1',
            correct: true,
            score: 5,
            maxScore: 5,
          },
        })
      )
    );
    expect(states).toHaveLength(2);
    expect(states.find((s) => s.text.includes('Alpha'))).toMatchObject({
      correct: true,
      wrong: false,
    });
    expect(states.find((s) => s.text.includes('Beta'))).toMatchObject({
      correct: false,
      wrong: false,
    });
  });

  it('highlights the correct answer green and the selection red for an incorrect question', async () => {
    const states = await renderedOptionStates(
      dataWith(
        choiceQuestion({
          result: {
            questionId: 'q1',
            answer: 'o1',
            correct: false,
            score: 0,
            maxScore: 5,
          },
          correctAnswer: 'o2',
        })
      )
    );
    expect(states.find((s) => s.text.includes('Beta'))).toMatchObject({
      correct: true,
      wrong: false,
    });
    expect(states.find((s) => s.text.includes('Alpha'))).toMatchObject({
      correct: false,
      wrong: true,
    });
  });

  it('highlights the correct answer green with no red selection when unanswered', async () => {
    const states = await renderedOptionStates(
      dataWith(
        choiceQuestion({
          result: { questionId: 'q1', correct: false, score: 0, maxScore: 5 },
          correctAnswer: 'o2',
        })
      )
    );
    expect(states.find((s) => s.text.includes('Beta'))).toMatchObject({
      correct: true,
      wrong: false,
    });
    expect(states.some((s) => s.wrong)).toBe(false);
  });
});

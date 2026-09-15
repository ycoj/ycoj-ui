import PreliminaryAttemptContent, {
  isCorrectOption,
} from './preliminary-attempt-content';
import type {
  PreliminaryAttemptData,
  PreliminaryReviewQuestion,
} from '@/api/server/method/preliminary/attempt';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

vi.mock('@/shared/components/markdown', () => ({
  default: ({ children }: { children: string }) => <>{children}</>,
}));

const GREEN_500 = 'oklab(0.723 -0.18885 0.110891 / 0.5)';
const RED_500 = 'oklab(0.637 0.214213 0.1014 / 0.5)';

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

async function optionBorder(label: string) {
  const labelElement = page.getByText(label, { exact: true });
  await expect.element(labelElement).toBeVisible();
  const row = labelElement.element().closest<HTMLElement>('[class*="border"]')!;
  await expect.poll(() => getComputedStyle(row).borderTopColor).not.toBe('');
  return getComputedStyle(row).borderTopColor;
}

function redBorders(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[class*="border"]')
  ).filter((element) => getComputedStyle(element).borderTopColor === RED_500);
}

test('isCorrectOption uses the user answer when the result is correct', () => {
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

test('isCorrectOption uses the correct answer key when the result is incorrect', () => {
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

test('isCorrectOption uses the correct answer key when unanswered', () => {
  const question = choiceQuestion({
    result: { questionId: 'q1', correct: false, score: 0, maxScore: 5 },
    correctAnswer: 'o2',
  });
  expect(isCorrectOption(question, 'o2')).toBe(true);
  expect(isCorrectOption(question, 'o1')).toBe(false);
});

test('isCorrectOption covers true/false questions without a correctAnswer key', () => {
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

test('highlights the user answer green for a correct question without a correctAnswer key', async () => {
  await renderContent(
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

  expect(await optionBorder('Alpha')).toBe(GREEN_500);
  const betaBorder = await optionBorder('Beta');
  expect(betaBorder).not.toBe(GREEN_500);
  expect(betaBorder).not.toBe(RED_500);
});

test('highlights the correct answer green and the selection red for an incorrect question', async () => {
  await renderContent(
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

  expect(await optionBorder('Beta')).toBe(GREEN_500);
  expect(await optionBorder('Alpha')).toBe(RED_500);
});

test('highlights the correct answer green with no red selection when unanswered', async () => {
  const { container } = await renderContent(
    dataWith(
      choiceQuestion({
        result: { questionId: 'q1', correct: false, score: 0, maxScore: 5 },
        correctAnswer: 'o2',
      })
    )
  );

  expect(await optionBorder('Beta')).toBe(GREEN_500);
  await expect.poll(() => redBorders(container).length).toBe(0);
});

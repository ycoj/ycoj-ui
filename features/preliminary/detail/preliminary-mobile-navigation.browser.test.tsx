import PreliminaryMobileNavigation from './preliminary-mobile-navigation';
import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import {
  getPreliminaryNavQuestions,
  getPreliminaryQuestionAnchorId,
} from '@/features/preliminary/lib/preliminary-utils';
import messages from '@/messages/en.json';
import { NextIntlClientProvider } from 'next-intl';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

vi.mock('@/features/preliminary/detail/preliminary-answer-provider', () => ({
  usePreliminaryAnswers: () => ({ isReady: true, isAnswered: () => false }),
}));

const data: PreliminaryDetailData = {
  paper: {
    docId: 'paper1',
    owner: 1,
    title: 'Practice paper',
    content: '',
    published: true,
    revision: 1,
    nAttempt: 0,
    updatedAt: '2026-09-05',
    questionCount: 1,
    totalScore: 2,
    sections: [
      {
        id: 'section1',
        type: 'single_choice',
        title: 'Questions',
        content: '',
        questions: [
          {
            id: 'q1',
            type: 'true_false',
            prompt: 'Question',
            score: 2,
          },
        ],
      },
    ],
  },
  owner: { _id: 1, uname: 'owner', mail: '', avatar: '' },
  attempts: [],
  canEdit: false,
  canSubmit: true,
};

const anchorId = getPreliminaryQuestionAnchorId('q1');

function renderNavigation() {
  const questions = getPreliminaryNavQuestions(data.paper.sections);
  expect(questions.map((question) => question.id)).toContain('q1');

  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div style={{ height: 900 }} />
      <div id={anchorId} tabIndex={-1}>
        Question
      </div>
      <div style={{ height: 1200 }} />
      <PreliminaryMobileNavigation paperId="paper1" data={data} />
    </NextIntlClientProvider>
  );
}

function trigger() {
  return page.getByRole('button', { name: messages.preliminary.directory });
}

test('closes the sheet, focuses and scrolls to the selected question', async () => {
  await page.viewport(480, 720);
  await renderNavigation();

  await userEvent.click(trigger());
  const dialog = page.getByRole('dialog');
  await expect.element(dialog).toBeVisible();

  const link = page.getByRole('link', { name: '1' });
  await expect.element(link).toBeVisible();
  expect(link.element().getAttribute('href')).toBe(`#${anchorId}`);

  await userEvent.click(link);
  await expect.element(dialog).not.toBeInTheDocument();

  const target = document.getElementById(anchorId)!;
  await expect.poll(() => document.activeElement?.id).toBe(anchorId);
  await expect
    .poll(() => Math.abs(target.getBoundingClientRect().top))
    .toBeLessThanOrEqual(1);
});

test('returns focus to the trigger when the sheet is dismissed', async () => {
  await page.viewport(480, 720);
  await renderNavigation();

  const triggerButton = trigger();
  await userEvent.click(triggerButton);
  await expect.element(page.getByRole('dialog')).toBeVisible();

  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  await expect
    .poll(() => document.activeElement === triggerButton.element())
    .toBe(true);
});

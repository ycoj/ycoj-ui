import PreliminaryMobileNavigation from './preliminary-mobile-navigation';
import type { PreliminaryDetailData } from '@/api/server/method/preliminary/detail';
import { getPreliminaryQuestionAnchorId } from '@/features/preliminary/lib/preliminary-utils';
import messages from '@/messages/en.json';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/preliminary/detail/preliminary-answer-provider', () => ({
  usePreliminaryAnswers: () => ({ isReady: true, isAnswered: () => false }),
}));
vi.mock('@/features/preliminary/detail/preliminary-sidebar', () => ({
  default: () => <div>Paper details</div>,
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
            explanation: '',
            answer: 'true',
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

function renderNavigation() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <div id={getPreliminaryQuestionAnchorId('q1')} tabIndex={-1}>
        Question
      </div>
      <PreliminaryMobileNavigation paperId="paper1" data={data} />
    </NextIntlClientProvider>
  );
}

describe('mobile question navigation', () => {
  it('closes the sheet and focuses and scrolls to the selected question', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const target = screen.getByText('Question');
    const scroll = vi.fn();
    target.scrollIntoView = scroll;
    await user.click(
      screen.getByRole('button', { name: messages.preliminary.directory })
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '1' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await waitFor(() => expect(target).toHaveFocus());
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
  });

  it('returns focus to the trigger when dismissed without navigating', async () => {
    const user = userEvent.setup();
    renderNavigation();
    const trigger = screen.getByRole('button', {
      name: messages.preliminary.directory,
    });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

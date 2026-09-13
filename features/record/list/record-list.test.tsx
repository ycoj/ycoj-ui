import RecordList from './record-list';
import type { RecordListResponse } from '@/api/server/method/record/list';
import messages from '@/messages/en.json';
import { PROBLEMS_DIFFICULTY_TEXT_COLOR } from '@/shared/configs/difficulty';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordListItem } from '@/shared/types/record';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

const record: RecordListItem = {
  _id: 'a'.repeat(24),
  domainId: 'system',
  pid: 1000,
  uid: 2,
  lang: 'cc.cc17',
  score: 100,
  memory: 0,
  time: 0,
  rejudged: false,
  judger: 0,
  judgeAt: '',
  status: 1,
};

function makeData(problem?: ProblemDoc): RecordListResponse {
  return {
    page: 1,
    rdocs: [record],
    tdoc: null,
    pdict: problem ? { [problem.docId]: problem } : {},
    udict: {},
    all: false,
    allDomain: false,
    notification: [],
  };
}

function renderList(problem?: ProblemDoc) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RecordList data={makeData(problem)} languages={{}} />
    </NextIntlClientProvider>
  );
}

describe('RecordList', () => {
  it('renders the problem id in its difficulty color', () => {
    renderList({
      docId: 1000,
      pid: 'P1000',
      title: 'Problem A',
      difficulty: 5,
    } as ProblemDoc);

    expect(screen.getByText('P1000.')).toHaveStyle({
      color: PROBLEMS_DIFFICULTY_TEXT_COLOR[5],
    });
  });

  it('renders the problem id in the unrated color without a difficulty', () => {
    renderList({
      docId: 1000,
      pid: 'P1000',
      title: 'Problem A',
    } as ProblemDoc);

    expect(screen.getByText('P1000.')).toHaveStyle({
      color: PROBLEMS_DIFFICULTY_TEXT_COLOR[0],
    });
  });
});

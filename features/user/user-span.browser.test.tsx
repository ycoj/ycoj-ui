import UserSpan from './user-span';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('UserSpan', () => {
  it('renders the CCF hook after the username', () => {
    render(
      <UserSpan
        user={{
          _id: 2,
          uname: 'alice',
          mail: 'alice@example.com',
          avatar: '',
          ccfLevel: 6,
        }}
        showAvatar={false}
      />
    );

    const username = screen.getByText('alice');
    const hook = screen.getByRole('img', { name: 'CCF 6' });

    expect(username.compareDocumentPosition(hook)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

'use client';

import ClientApis from '@/api/client/method';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type Props = {
  pid: string | number;
  sid: string;
  initialVote: number;
  initialUserVote?: 1 | -1 | 0;
};

export default function SolutionVote({
  pid,
  sid,
  initialVote,
  initialUserVote = 0,
}: Props) {
  const [vote, setVote] = useState(initialVote);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [submitting, setSubmitting] = useState(false);

  const handleUpvote = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await ClientApis.Problem.voteSolution(pid, sid, 'upvote');
    setVote(res.vote);
    setUserVote(res.user_vote);
    setSubmitting(false);
  };

  const handleDownvote = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await ClientApis.Problem.voteSolution(pid, sid, 'downvote');
    setVote(res.vote);
    setUserVote(res.user_vote);
    setSubmitting(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          'text-muted-foreground hover:text-foreground',
          userVote === 1 && 'text-emerald-600 dark:text-emerald-400'
        )}
        onClick={handleUpvote}
        disabled={submitting}
        aria-label="upvote"
      >
        <ChevronUp strokeWidth={2.5} />
      </Button>
      <span className="text-base tabular-nums" data-llm-text={String(vote)}>
        {vote}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={cn(
          'text-muted-foreground hover:text-foreground',
          userVote === -1 && 'text-rose-600 dark:text-rose-400'
        )}
        onClick={handleDownvote}
        disabled={submitting}
        aria-label="downvote"
      >
        <ChevronDown strokeWidth={2.5} />
      </Button>
    </div>
  );
}

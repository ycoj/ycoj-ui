'use client';

import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, Tag } from 'lucide-react';
import { useState } from 'react';

type Props = {
  tagList: string[];
};

export function ProblemTags({ tagList }: Props) {
  const [visible, setVisible] = useState(false);

  if (!tagList.length) return null;

  if (!visible) {
    return (
      <Badge
        asChild
        variant="secondary"
        className={cn('cursor-pointer select-none font-medium')}
      >
        <button type="button" onClick={() => setVisible(true)}>
          显示标签
          <ChevronRight strokeWidth={3} data-icon="inline-start" />
        </button>
      </Badge>
    );
  }

  return tagList.map((tag) => (
    <Badge
      key={tag}
      variant="secondary"
      className={cn('font-medium')}
      data-llm-text={tag}
    >
      <Tag data-icon="inline-start" />
      {tag}
    </Badge>
  ));
}

'use client';

import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Props = {
  tagList: string[];
};

export function ProblemTags({ tagList }: Props) {
  const t = useTranslations('problem');
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
          {t('showTags')}
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

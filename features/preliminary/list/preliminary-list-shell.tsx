import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import type { LucideIcon } from 'lucide-react';

type PreliminaryListEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function PreliminaryListEmpty({
  icon: Icon,
  title,
  description,
}: PreliminaryListEmptyProps) {
  return (
    <Empty className="border border-dashed" data-llm-visible="true">
      <EmptyMedia variant="icon">
        <Icon strokeWidth={2} />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle data-llm-text={title}>{title}</EmptyTitle>
        <EmptyDescription data-llm-text={description}>
          {description}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

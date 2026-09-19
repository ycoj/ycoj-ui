import PreliminaryMarkdown from '@/features/preliminary/markdown/preliminary-markdown';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  content?: string;
  children: ReactNode;
};

export default function PreliminarySectionShell({
  title,
  content,
  children,
}: Props) {
  return (
    <Card className="min-w-0">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-base md:text-lg" data-llm-text={title}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-4 md:px-6">
        {content?.trim() && (
          <PreliminaryMarkdown>{content}</PreliminaryMarkdown>
        )}
        <ol className="space-y-6 md:space-y-4">{children}</ol>
      </CardContent>
    </Card>
  );
}

import Markdown from '@/shared/components/markdown';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Megaphone } from 'lucide-react';

export type Props = {
  bulletin?: string;
};

export default function Bulletin({ bulletin }: Props) {
  if (!bulletin) return null;

  return (
    <Card data-llm-visible="true">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="size-5" />
          <span data-llm-text="公告">公告</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Markdown>{bulletin}</Markdown>
      </CardContent>
    </Card>
  );
}

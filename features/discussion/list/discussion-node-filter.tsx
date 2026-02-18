'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { Node } from '@/shared/types/discussion';
import { Plus, Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type Props = {
  vnodes: Node[];
};

export default function DiscussionNodeFilter({ vnodes }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentNode = searchParams.get('node') || 'all';

  const nodeOptions = useMemo(() => {
    return vnodes.map((vnode) => ({
      id: vnode.docId,
      title: vnode.title ?? vnode.docId,
    }));
  }, [vnodes]);

  const handleNodeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete('node');
    } else {
      params.set('node', value);
    }
    params.delete('page');

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={currentNode} onValueChange={handleNodeChange}>
        <SelectTrigger className="w-64 min-w-[256px]">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-muted-foreground" />
            <SelectValue placeholder="讨论节点" />
          </div>
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">全部节点</SelectItem>
          {nodeOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentNode !== 'all' && (
        <Button asChild className="ml-auto">
          <Link
            href={`/discussion/create?node=${currentNode}`}
            className="gap-2"
          >
            <Plus strokeWidth={2} />
            创建讨论
          </Link>
        </Button>
      )}
    </div>
  );
}

'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Search01Icon, Tag01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

type Props = {
  groups: string[];
};

export default function HomeworkFilter({ groups }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState(searchParams.get('group') || 'all');
  const uniqueGroups = useMemo(
    () => Array.from(new Set(groups.filter(Boolean))),
    [groups]
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const params = new URLSearchParams(searchParams.toString());

    const syncParam = (key: string, value: string) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };

    syncParam('q', q);
    syncParam('group', group === 'all' ? '' : group);
    params.delete('page');

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Input
            name="q"
            defaultValue={searchParams.get('q') || ''}
            placeholder="搜索作业标题"
            className="pl-9 pr-3 text-sm"
          />
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-44 min-w-[176px]">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Tag01Icon}
                className="size-4 text-muted-foreground"
              />
              <SelectValue placeholder="分组" />
            </div>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">全部分组</SelectItem>
            {uniqueGroups.map((groupName) => (
              <SelectItem key={groupName} value={groupName}>
                {groupName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" variant="secondary" className="ml-auto gap-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          筛选
        </Button>
      </div>
    </form>
  );
}

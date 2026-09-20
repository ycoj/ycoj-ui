'use client';

import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
};

export default function TrainingTagsToggle({ href, children }: Props) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    router.push(href);
  };

  return (
    <Button asChild variant="link" className="h-auto p-0 text-sm font-medium">
      <a href={href} onClick={handleClick}>
        {children}
      </a>
    </Button>
  );
}

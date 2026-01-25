import { cn } from '@/shared/lib/utils';
import React from 'react';

type Ratio = '7-3' | '8-2';

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right?: React.ReactNode;
  gap?: string; // Tailwind gap class, e.g., 'gap-4', 'gap-x-8'
  ratio?: Ratio;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  gap = 'gap-8',
  ratio = '7-3',
}) => {
  if (!right) return left;
  return (
    <div className={cn('grid grid-cols-1 items-start md:grid-cols-10', gap)}>
      <div
        className={cn({
          'md:col-span-7': ratio === '7-3',
          'md:col-span-8': ratio === '8-2',
        })}
      >
        {left}
      </div>
      <div
        className={cn({
          'md:col-span-3': ratio === '7-3',
          'md:col-span-2': ratio === '8-2',
        })}
      >
        {right}
      </div>
    </div>
  );
};

export default TwoColumnLayout;

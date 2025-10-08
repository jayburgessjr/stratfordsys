import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
};

export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
  role,
  ...props
}: SeparatorProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      role={decorative ? 'presentation' : role ?? 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'bg-border',
        isVertical ? 'w-px h-full' : 'h-px w-full',
        className
      )}
      {...props}
    />
  );
}

export default Separator;

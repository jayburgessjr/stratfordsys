import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface GradientStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function GradientStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  trend,
  className
}: GradientStatCardProps) {
  // Map gradient prop to simple border accent color instead of full background
  const accentColor = {
    blue: 'border-l-blue-500',
    purple: 'border-l-violet-500',
    green: 'border-l-emerald-500',
    orange: 'border-l-orange-500',
    red: 'border-l-rose-500',
    teal: 'border-l-teal-500'
  };

  return (
    <Card className={cn("rounded-sm border-l-4 shadow-sm hover:shadow-md transition-all", accentColor[gradient], className)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground/70" />
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-mono font-medium tracking-tight text-foreground">
            {value}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          {trend && (
            <div className={cn(
              "flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium",
              trend.isPositive
                ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400"
            )}>
              <span>{trend.isPositive ? '▲' : '▼'}</span>
              <span>{trend.value}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-muted-foreground/80 truncate ml-2 max-w-[120px]">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

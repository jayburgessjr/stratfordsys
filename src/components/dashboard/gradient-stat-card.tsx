import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const gradientClasses = {
    blue: 'bg-gradient-blue',
    purple: 'bg-gradient-purple',
    green: 'bg-gradient-green',
    orange: 'bg-gradient-orange',
    red: 'bg-gradient-red',
    teal: 'bg-gradient-teal'
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105',
        gradientClasses[gradient],
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
        <Icon className="h-32 w-32" strokeWidth={1} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={cn(
              "px-2 py-1 rounded-md text-xs font-semibold bg-white/20 backdrop-blur-sm",
              trend.isPositive ? 'text-white' : 'text-white/80'
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-white/70 text-xs mt-2">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
    </div>
  );
}

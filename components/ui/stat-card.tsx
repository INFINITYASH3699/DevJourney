// components/ui/stat-card.tsx

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  fullValue?: string | number;
  description?: ReactNode;
  mobileDescription?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  fullValue,
  description,
  mobileDescription,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              <span className="sm:hidden">{value}</span>
              <span className="hidden sm:inline">{fullValue || value}</span>
            </p>
            {(description || mobileDescription) && (
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                <span className="sm:hidden">{mobileDescription}</span>
                <span className="hidden sm:inline">{description}</span>
              </p>
            )}
          </div>
          <div className={cn(
            'p-1.5 sm:p-2 rounded-lg bg-muted/50 flex-shrink-0',
            iconColor
          )}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        {trend && (
          <div className={cn(
            'mt-2 text-xs font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// components/dashboard/progress-overview.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/types';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface ProgressOverviewProps {
  stats: DashboardStats;
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  const [expanded, setExpanded] = useState(false);

  // Safety check
  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  const categoryColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
  ];

  const { overallProgress = 0, categoriesProgress = [] } = stats;
  
  // Show first 3 on mobile, all when expanded
  const visibleCategories = expanded 
    ? categoriesProgress 
    : categoriesProgress.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Progress Rings - Responsive using wrapper divs */}
        <div className="flex justify-center gap-3 sm:gap-6 py-3 sm:py-4 overflow-x-auto">
          {/* Overall Progress Ring */}
          <div className="flex-shrink-0">
            {/* Mobile */}
            <div className="sm:hidden">
              <ProgressRing
                progress={overallProgress}
                label="Overall"
                color="#3b82f6"
                size={80}
              />
            </div>
            {/* Desktop */}
            <div className="hidden sm:block">
              <ProgressRing
                progress={overallProgress}
                label="Overall"
                color="#3b82f6"
                size={100}
              />
            </div>
          </div>

          {/* Category Progress Rings */}
          {categoriesProgress.slice(0, 2).map((cat, index) => (
            <div key={cat.category} className="flex-shrink-0">
              {/* Mobile */}
              <div className="sm:hidden">
                <ProgressRing
                  progress={cat.percentage}
                  label={cat.category.length > 8 ? cat.category.slice(0, 8) + '...' : cat.category}
                  color={categoryColors[(index + 1) % categoryColors.length]}
                  size={70}
                />
              </div>
              {/* Desktop */}
              <div className="hidden sm:block">
                <ProgressRing
                  progress={cat.percentage}
                  label={cat.category.length > 12 ? cat.category.slice(0, 12) + '...' : cat.category}
                  color={categoryColors[(index + 1) % categoryColors.length]}
                  size={90}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        {categoriesProgress.length > 0 && (
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
              By Category
            </h4>
            {visibleCategories.map((cat, index) => (
              <div key={cat.category} className="space-y-1 sm:space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-medium truncate max-w-[55%] sm:max-w-[60%]">
                    {cat.category}
                  </span>
                  <span className="text-muted-foreground">
                    {cat.completed} / {cat.total}
                  </span>
                </div>
                <Progress
                  value={cat.percentage}
                  className="h-1.5 sm:h-2"
                  style={
                    {
                      '--progress-color': categoryColors[index % categoryColors.length],
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}

            {/* Show more/less button */}
            {categoriesProgress.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full text-xs sm:text-sm h-8 mt-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Show {categoriesProgress.length - 3} more
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {categoriesProgress.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <p className="text-sm">Add playlists to see your progress by category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
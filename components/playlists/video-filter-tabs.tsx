'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface VideoFilterTabsProps {
  currentStatus?: string;
  stats: {
    total: number;
    completed: number;
    watching: number;
    notStarted: number;
  };
}

export function VideoFilterTabs({ currentStatus, stats }: VideoFilterTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentStatus || 'all'}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-4 h-auto p-1">
        <TabsTrigger
          value="all"
          className="text-xs sm:text-sm py-2 px-1 sm:px-3"
        >
          <span className="hidden sm:inline">All ({stats.total})</span>
          <span className="sm:hidden">All</span>
        </TabsTrigger>
        <TabsTrigger
          value="not_started"
          className="text-xs sm:text-sm py-2 px-1 sm:px-3"
        >
          <span className="hidden sm:inline">Not Started ({stats.notStarted})</span>
          <span className="sm:hidden">New</span>
        </TabsTrigger>
        <TabsTrigger
          value="watching"
          className="text-xs sm:text-sm py-2 px-1 sm:px-3"
        >
          <span className="hidden sm:inline">Watching ({stats.watching})</span>
          <span className="sm:hidden">Watch</span>
        </TabsTrigger>
        <TabsTrigger
          value="completed"
          className="text-xs sm:text-sm py-2 px-1 sm:px-3"
        >
          <span className="hidden sm:inline">Completed ({stats.completed})</span>
          <span className="sm:hidden">Done</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
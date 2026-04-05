// components/dashboard/stats-overview.tsx

import { StatCard } from '@/components/ui/stat-card';
import { ListVideo, CheckCircle2, Play, Flame } from 'lucide-react';
import { DashboardStats } from '@/types';

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Videos"
        value={stats.totalVideos}
        description={
          <span className="hidden sm:inline">{`Across ${stats.totalPlaylists} playlists`}</span>
        }
        mobileDescription={`${stats.totalPlaylists} playlists`}
        icon={ListVideo}
        iconColor="text-blue-500"
      />

      <StatCard
        title="Completed"
        value={stats.completedVideos}
        description={
          <span className="hidden sm:inline">{`${Math.round(stats.overallProgress)}% progress`}</span>
        }
        mobileDescription={`${Math.round(stats.overallProgress)}%`}
        icon={CheckCircle2}
        iconColor="text-green-500"
      />

      <StatCard
        title="Watching"
        value={stats.watchingVideos}
        description={<span className="hidden sm:inline">In progress</span>}
        mobileDescription="In progress"
        icon={Play}
        iconColor="text-orange-500"
      />

      <StatCard
        title="Streak"
        value={`${stats.streak}d`}
        fullValue={`${stats.streak} days`}
        description={
          <span className="hidden sm:inline">{`+${stats.weekProgress} this week`}</span>
        }
        mobileDescription={`+${stats.weekProgress}/week`}
        icon={Flame}
        iconColor="text-red-500"
      />
    </div>
  );
}
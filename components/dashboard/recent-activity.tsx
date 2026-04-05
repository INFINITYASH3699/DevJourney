// components/dashboard/recent-activity.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { RecentVideo, VideoStatus } from '@/types';
import { formatRelativeDate } from '@/lib/utils';
import Link from 'next/link';

interface RecentActivityProps {
  videos: RecentVideo[];
}

const statusConfig: Record<
  VideoStatus,
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  COMPLETED: {
    icon: CheckCircle,
    color: 'text-green-500',
    label: 'Completed',
  },
  WATCHING: {
    icon: PlayCircle,
    color: 'text-orange-500',
    label: 'Watching',
  },
  NOT_STARTED: {
    icon: Clock,
    color: 'text-gray-400',
    label: 'Not Started',
  },
};

export function RecentActivity({ videos }: RecentActivityProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Show 3 on mobile initially, 5 on desktop
  const displayCount = showAll ? videos.length : 3;
  const displayedVideos = videos.slice(0, displayCount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
        <Link href="/playlists">
          <Button variant="ghost" size="sm" className="text-xs h-8">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {videos.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No recent activity. Start watching videos!
            </p>
            <Link href="/playlists">
              <Button variant="outline" size="sm" className="mt-4">
                Browse Playlists
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {displayedVideos.map((video) => {
              const config = statusConfig[video.status];
              const StatusIcon = config.icon;

              return (
                <Link
                  key={video.id}
                  href={`/playlists/${video.playlistId}`}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <StatusIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </p>
                    {video.playlist && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                        {video.playlist.title}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-4 sm:h-5"
                      >
                        {config.label}
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatRelativeDate(video.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Show more button */}
            {videos.length > 3 && !showAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full text-xs h-8"
              >
                <ChevronDown className="h-3 w-3 mr-1" />
                Show {videos.length - 3} more
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
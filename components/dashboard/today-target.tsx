// components/dashboard/today-target.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { TodayTarget, PlaylistDailyTarget } from '@/types';
import { minutesToReadable } from '@/lib/utils';

interface TodayTargetProps {
  userId: string;
}

export function TodayTargetCard({ userId }: TodayTargetProps) {
  const [target, setTarget] = useState<TodayTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTodayTarget();
  }, []);

  const fetchTodayTarget = async () => {
    try {
      const response = await fetch('/api/dashboard/today-target');
      if (response.ok) {
        const data = await response.json();
        setTarget(data);
      }
    } catch (error) {
      console.error('Error fetching today target:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-36 sm:h-48">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!target || target.playlists.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Today's Target
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-4 sm:py-6">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              No learning targets set yet
            </p>
            <Link href="/playlists">
              <Button variant="outline" size="sm">
                Set Target for a Playlist
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = target.totalMinutes > 0 
    ? (target.completedMinutes / target.totalMinutes) * 100 
    : 0;

  const hasOverdue = target.playlists.some(p => p.isOverdue);
  const visiblePlaylists = expanded ? target.playlists : target.playlists.slice(0, 2);

  return (
    <Card className={hasOverdue ? 'border-red-200 dark:border-red-900' : ''}>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Today's Target
          </CardTitle>
          {target.onTrack ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              On Track
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Behind
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Overall Progress */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Daily Progress</span>
            <span className="font-medium">
              {minutesToReadable(target.completedMinutes)} / {minutesToReadable(target.totalMinutes)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Video Progress - Compact on mobile */}
        <div className="flex items-center justify-between text-xs sm:text-sm bg-muted/50 rounded-lg p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
            <span>Videos Today</span>
          </div>
          <span className="font-medium">
            {target.videosCompleted} / {target.videosTarget}
          </span>
        </div>

        {/* Playlist Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
            Playlist Targets
          </h4>
          {visiblePlaylists.map((playlist) => (
            <PlaylistTargetItem key={playlist.playlistId} playlist={playlist} />
          ))}
          
          {target.playlists.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs h-8"
            >
              {expanded ? (
                'Show less'
              ) : (
                <>
                  +{target.playlists.length - 2} more playlists
                  <ChevronRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlaylistTargetItem({ playlist }: { playlist: PlaylistDailyTarget }) {
  return (
    <Link href={`/playlists/${playlist.playlistId}`}>
      <div className={`
        flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm
        hover:bg-accent transition-colors
        ${playlist.isOverdue 
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900' 
          : 'bg-muted/50'
        }
      `}>
        <div className="flex-1 min-w-0 mr-2">
          <p className="font-medium truncate text-xs sm:text-sm">{playlist.playlistTitle}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <span>{playlist.targetVideos} videos</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {minutesToReadable(playlist.targetMinutes)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {playlist.isOverdue ? (
            <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0">
              {playlist.daysOverdue}d late
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
              {playlist.remainingDays}d left
            </Badge>
          )}
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
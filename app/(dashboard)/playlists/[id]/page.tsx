// app/(dashboard)/playlists/[id]/page.tsx

import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getPlaylistWithVideos } from '@/lib/queries/playlists';
import { VideoList } from '@/components/playlists/video-list';
import { VideoFilterTabs } from '@/components/playlists/video-filter-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ListVideo,
  CheckCircle2,
  PlayCircle,
  Circle,
  Calendar,
  Target,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { VideoListSkeleton } from '@/components/shared/skeleton-loader';
import { 
  formatDeadlineStatus, 
  secondsToReadable, 
  minutesToReadable,
  getDaysUntil,
  calculateTargetVideos,
} from '@/lib/utils';
import { TargetSettingsDialog } from '@/components/playlists/target-settings-dialog';

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

async function PlaylistDetailContent({
  params,
  searchParams,
}: PlaylistDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const { id } = await params;
  const { status } = await searchParams;

  const playlist = await getPlaylistWithVideos(user.id, id);

  if (!playlist) {
    notFound();
  }

  const progress =
    playlist.totalVideos > 0
      ? (playlist.completedVideos / playlist.totalVideos) * 100
      : 0;

  // Filter videos by status
  let filteredVideos = playlist.videos;
  if (status && status !== 'all') {
    filteredVideos = playlist.videos.filter(
      (v) => v.status === status.toUpperCase()
    );
  }

  const stats = {
    total: playlist.videos.length,
    completed: playlist.videos.filter((v) => v.status === 'COMPLETED').length,
    watching: playlist.videos.filter((v) => v.status === 'WATCHING').length,
    notStarted: playlist.videos.filter((v) => v.status === 'NOT_STARTED').length,
  };

  // Target info
  const deadlineStatus = playlist.targetDate 
    ? formatDeadlineStatus(playlist.targetDate)
    : null;
  
  const remainingVideos = stats.total - stats.completed;
  const remainingDays = playlist.targetDate 
    ? Math.max(0, getDaysUntil(playlist.targetDate))
    : 0;
  const dailyVideosNeeded = remainingDays > 0 
    ? calculateTargetVideos(remainingVideos, remainingDays)
    : remainingVideos;

  // Calculate remaining watch time
  const remainingSeconds = playlist.videos
    .filter(v => v.status !== 'COMPLETED')
    .reduce((sum, v) => sum + v.durationSeconds, 0);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/playlists">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Playlists</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </Link>

      {/* Playlist Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Thumbnail */}
        {playlist.thumbnailUrl && (
          <div className="relative w-full sm:w-64 aspect-video sm:h-36 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image
              src={playlist.thumbnailUrl}
              alt={playlist.title}
              fill
              className="object-cover"
              priority
            />
            {/* Deadline overlay */}
            {deadlineStatus && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${deadlineStatus.color}`}>
                {deadlineStatus.urgent && <AlertTriangle className="h-3 w-3" />}
                {deadlineStatus.text}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {playlist.title}
            </h1>
            <Badge variant="secondary" className="flex-shrink-0">
              {playlist.category}
            </Badge>
          </div>

          {playlist.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {playlist.description}
            </p>
          )}

          {/* Stats Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <ListVideo className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{stats.total} videos</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{stats.completed} completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PlayCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span>{stats.watching} watching</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{secondsToReadable(remainingSeconds)} left</span>
            </div>
          </div>

          {/* Target Info */}
          {playlist.targetDate && (
            <div className={`
              rounded-lg p-3 mb-4 flex flex-wrap items-center gap-4 text-sm
              ${deadlineStatus?.urgent 
                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' 
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }
            `}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(playlist.targetDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>~{dailyVideosNeeded} videos/day needed</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <VideoFilterTabs currentStatus={status} stats={stats} />

      {/* Videos List */}
      <VideoList videos={filteredVideos} playlistId={id} />
    </div>
  );
}

export default function PlaylistDetailPage(props: PlaylistDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="w-full sm:w-64 aspect-video bg-muted rounded-lg animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <VideoListSkeleton />
        </div>
      }
    >
      <PlaylistDetailContent {...props} />
    </Suspense>
  );
}
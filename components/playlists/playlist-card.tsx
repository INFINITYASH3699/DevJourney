// components/playlists/playlist-card.tsx

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Playlist } from '@/types';
import { 
  Play, 
  Trash2, 
  Loader2, 
  MoreVertical, 
  Calendar, 
  Target as TargetIcon,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatDeadlineStatus, secondsToReadable } from '@/lib/utils';
import { TargetSettingsDialog } from './target-settings-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  const progress =
    playlist.totalVideos > 0
      ? (playlist.completedVideos / playlist.totalVideos) * 100
      : 0;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Playlist deleted');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete playlist');
    } finally {
      setDeleting(false);
    }
  };

  // Target/Deadline status
  const deadlineStatus = playlist.targetDate 
    ? formatDeadlineStatus(playlist.targetDate)
    : null;

  return (
    <>
      <Card className="overflow-hidden card-hover group">
        <CardHeader className="p-0">
          <Link href={`/playlists/${playlist.id}`}>
            <div className="relative aspect-video bg-muted">
              {playlist.thumbnailUrl ? (
                <Image
                  src={playlist.thumbnailUrl}
                  alt={playlist.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              {/* Progress Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Deadline Badge */}
              {deadlineStatus && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${deadlineStatus.color}`}>
                  {deadlineStatus.urgent && <AlertTriangle className="h-3 w-3" />}
                  {deadlineStatus.text}
                </div>
              )}

              {/* Total Duration */}
              {playlist.totalDuration > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {secondsToReadable(playlist.totalDuration)}
                </div>
              )}
            </div>
          </Link>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href={`/playlists/${playlist.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                {playlist.title}
              </h3>
            </Link>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {playlist.category}
            </Badge>
          </div>

          {playlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {playlist.description}
            </p>
          )}

          {/* Daily Target Info */}
          {playlist.targetDate && playlist.dailyTarget && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
              <TargetIcon className="h-3 w-3" />
              <span>
                Daily: ~{Math.ceil(playlist.dailyTarget)} min
                {playlist.targetVideos && ` / ${playlist.targetVideos} videos`}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {playlist.completedVideos} / {playlist.totalVideos}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Link href={`/playlists/${playlist.id}`} className="flex-1">
            <Button className="w-full" size="sm">
              <Play className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">View Videos</span>
              <span className="xs:hidden">View</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowTargetDialog(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                {playlist.targetDate ? 'Edit Target' : 'Set Target Date'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Target Settings Dialog */}
      <TargetSettingsDialog
        isOpen={showTargetDialog}
        onClose={() => setShowTargetDialog(false)}
        playlist={playlist}
        onUpdate={() => router.refresh()}
      />
    </>
  );
}
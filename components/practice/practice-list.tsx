// components/practice/practice-list.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoWithPartialPlaylist } from '@/lib/queries/videos';
import {
  Target,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  Loader2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseDuration } from '@/lib/utils';
import { VideoPlayerModal } from '@/components/shared/video-player-modal';
import { Video } from '@/types';

interface PracticeListProps {
  practiceVideos: VideoWithPartialPlaylist[];
  completedVideos: VideoWithPartialPlaylist[];
}

export function PracticeList({ practiceVideos, completedVideos }: PracticeListProps) {
  const [activeTab, setActiveTab] = useState('practice');
  const [selectedVideo, setSelectedVideo] = useState<VideoWithPartialPlaylist | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();

  const removeFromPractice = async (videoId: string) => {
    setRemovingId(videoId);
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPractice: false }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Removed from practice list');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove from practice list');
    } finally {
      setRemovingId(null);
    }
  };

  const addToPractice = async (videoId: string) => {
    setRemovingId(videoId);
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPractice: true }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Added to practice list');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add to practice list');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="practice" className="gap-2">
                <Target className="h-4 w-4" />
                To Practice ({practiceVideos.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({completedVideos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-3">
              {practiceVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No videos marked for practice</p>
                  <p className="text-sm mt-1">
                    Mark videos for practice from the playlist view
                  </p>
                </div>
              ) : (
                practiceVideos.map((video) => (
                  <PracticeVideoItem
                    key={video.id}
                    video={video}
                    onWatch={() => setSelectedVideo(video)}
                    onRemove={() => removeFromPractice(video.id)}
                    isRemoving={removingId === video.id}
                    showRemove
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No completed videos yet</p>
                  <p className="text-sm mt-1">
                    Complete some videos to see them here
                  </p>
                </div>
              ) : (
                completedVideos.map((video) => (
                  <PracticeVideoItem
                    key={video.id}
                    video={video}
                    onWatch={() => setSelectedVideo(video)}
                    onAdd={video.needsPractice ? undefined : () => addToPractice(video.id)}
                    isRemoving={removingId === video.id}
                    showAdd={!video.needsPractice}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          video={selectedVideo as Video}
          onStatusChange={() => router.refresh()}
        />
      )}
    </>
  );
}

// Individual Video Item
interface PracticeVideoItemProps {
  video: VideoWithPartialPlaylist;
  onWatch: () => void;
  onRemove?: () => void;
  onAdd?: () => void;
  isRemoving: boolean;
  showRemove?: boolean;
  showAdd?: boolean;
}

function PracticeVideoItem({
  video,
  onWatch,
  onRemove,
  onAdd,
  isRemoving,
  showRemove,
  showAdd,
}: PracticeVideoItemProps) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      {/* Thumbnail */}
      <div
        className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-muted rounded overflow-hidden cursor-pointer"
        onClick={onWatch}
      >
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <PlayCircle className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={onWatch}
        >
          {video.title}
        </h4>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {video.playlist && (
            <Link href={`/playlists/${video.playlist.id}`}>
              <Badge variant="secondary" className="text-xs hover:bg-secondary/80">
                {video.playlist.category}
              </Badge>
            </Link>
          )}
          {video.duration && (
            <span className="text-xs text-muted-foreground">
              {parseDuration(video.duration)}
            </span>
          )}
          {video.aiTakeaways && (
            <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
          {video.notes && (
            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <BookOpen className="h-3 w-3 mr-1" />
              Notes
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={onWatch} className="h-7 text-xs">
            <PlayCircle className="h-3 w-3 mr-1" />
            Watch
          </Button>

          {showRemove && onRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              disabled={isRemoving}
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Remove'
              )}
            </Button>
          )}

          {showAdd && onAdd && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onAdd}
              disabled={isRemoving}
              className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Target className="h-3 w-3 mr-1" />
                  Add to Practice
                </>
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              window.open(
                `https://www.youtube.com/watch?v=${video.videoId}`,
                '_blank'
              )
            }
            className="h-7 text-xs ml-auto"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
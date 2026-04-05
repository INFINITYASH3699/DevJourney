'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoWithPlaylist } from '@/types';
import {
  ExternalLink,
  CheckCircle2,
  PlayCircle,
  Target,
  RotateCcw,
  X,
  Clock,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VideoPlayerModal } from '@/components/shared/video-player-modal';
import { parseDuration } from '@/lib/utils';

interface PracticeCardProps {
  video: VideoWithPlaylist;
  showReviewMode?: boolean;
}

export function PracticeCard({ video, showReviewMode = false }: PracticeCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const updatePracticeStatus = async (needsPractice: boolean) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPractice }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success(
        needsPractice
          ? 'Added to practice list'
          : 'Removed from practice list'
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Thumbnail */}
            <div
              className="relative w-full sm:w-48 h-32 sm:h-28 flex-shrink-0 bg-muted cursor-pointer group"
              onClick={() => setShowPlayer(true)}
            >
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-muted-foreground" />
                </div>
              )}

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white rounded-full p-2">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Duration */}
              {video.duration && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {parseDuration(video.duration)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowPlayer(true)}
                  >
                    {video.title}
                  </h3>

                  {video.playlist && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                      {video.playlist.title}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {video.playlist?.category && (
                      <Badge variant="secondary" className="text-xs">
                        {video.playlist.category}
                      </Badge>
                    )}
                    {video.needsPractice && (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Practice
                      </Badge>
                    )}
                    {video.status === 'COMPLETED' && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Done
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:flex-col">
                  {showReviewMode ? (
                    <>
                      <Button
                        size="sm"
                        variant={video.needsPractice ? 'secondary' : 'outline'}
                        onClick={() =>
                          updatePracticeStatus(!video.needsPractice)
                        }
                        disabled={updating}
                        className="flex-1 sm:flex-none"
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : video.needsPractice ? (
                          <>
                            <X className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Remove</span>
                          </>
                        ) : (
                          <>
                            <Target className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Practice</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPlayer(true)}
                        className="flex-1 sm:flex-none"
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Review</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updatePracticeStatus(false)}
                        disabled={updating}
                        className="flex-1 sm:flex-none"
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Done</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPlayer(true)}
                        className="flex-1 sm:flex-none"
                      >
                        <PlayCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Watch</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        video={video}
        onStatusChange={() => router.refresh()}
      />
    </>
  );
}
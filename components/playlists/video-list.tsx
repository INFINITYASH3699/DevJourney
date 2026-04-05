'use client';

import { VideoItem } from './video-item';
import { EmptyState } from '@/components/shared/empty-state';
import { Video } from '@/types';

interface VideoListProps {
  videos: Video[];
  playlistId: string;
}

export function VideoList({ videos, playlistId }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <EmptyState
        type="videos"
        title="No videos found"
        description="Try changing the filter to see more videos."
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {videos.map((video) => (
        <VideoItem key={video.id} video={video} />
      ))}
    </div>
  );
}
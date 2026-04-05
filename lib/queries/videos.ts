// lib/queries/videos.ts

import { prisma } from '@/lib/prisma';
import { Video, VideoStatus, TakeawaysStatus } from '@/types';
import { updatePlaylistProgress } from './playlists';

// Helper function to transform Prisma video to Video type
function transformVideo(video: {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  durationSeconds: number;
  position: number;
  status: VideoStatus;
  lastWatchedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  aiTakeaways: string | null;
  shortTakeaway: string | null;
  takeawaysStatus: string | null;
  needsPractice: boolean;
  practiceNotes: string | null;
  watchProgress: number;
  createdAt: Date;
  updatedAt: Date;
}): Video {
  return {
    ...video,
    takeawaysStatus: video.takeawaysStatus as TakeawaysStatus | null,
  };
}

// Type for video with partial playlist
export interface VideoWithPartialPlaylist extends Video {
  playlist?: {
    id: string;
    title: string;
    category: string;
  };
}

export async function getVideosByPlaylist(
  playlistId: string,
  status?: string
): Promise<Video[]> {
  const where: { playlistId: string; status?: VideoStatus } = { playlistId };

  if (status && status !== 'all') {
    where.status = status.toUpperCase() as VideoStatus;
  }

  const videos = await prisma.video.findMany({
    where,
    orderBy: { position: 'asc' },
  });

  return videos.map(transformVideo);
}

export async function getPracticeVideos(
  userId: string
): Promise<VideoWithPartialPlaylist[]> {
  const videos = await prisma.video.findMany({
    where: {
      playlist: { userId },
      needsPractice: true,
    },
    include: {
      playlist: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return videos.map(video => ({
    ...transformVideo(video),
    playlist: video.playlist,
  }));
}

export async function getCompletedVideos(
  userId: string,
  limit: number = 20
): Promise<VideoWithPartialPlaylist[]> {
  const videos = await prisma.video.findMany({
    where: {
      playlist: { userId },
      status: 'COMPLETED',
    },
    include: {
      playlist: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: limit,
  });

  return videos.map(video => ({
    ...transformVideo(video),
    playlist: video.playlist,
  }));
}

export async function updateVideoStatus(
  videoId: string,
  userId: string,
  data: {
    status?: VideoStatus;
    notes?: string;
    needsPractice?: boolean;
    practiceNotes?: string;
  }
): Promise<Video | null> {
  // Verify ownership
  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      playlist: { userId },
    },
  });

  if (!video) return null;

  const updateData: Record<string, unknown> = { ...data };

  if (data.status === 'WATCHING') {
    updateData.lastWatchedAt = new Date();
  } else if (data.status === 'COMPLETED') {
    updateData.completedAt = new Date();
    updateData.lastWatchedAt = new Date();
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: updateData,
  });

  // Update playlist progress
  await updatePlaylistProgress(video.playlistId);

  return transformVideo(updated);
}

export async function updateVideoTakeaways(
  videoId: string,
  takeaways: string,
  status: 'completed' | 'error'
): Promise<void> {
  await prisma.video.update({
    where: { id: videoId },
    data: {
      aiTakeaways: takeaways,
      takeawaysStatus: status,
    },
  });
}
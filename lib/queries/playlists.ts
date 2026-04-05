// lib/queries/playlists.ts

import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/cache';
import { PlaylistWithVideos, Playlist, Video, TakeawaysStatus } from '@/types';

export async function getPlaylists(
  userId: string,
  category?: string
): Promise<Playlist[]> {
  const cacheKey = `playlists:${userId}:${category || 'all'}`;

  return getCached(
    cacheKey,
    async () => {
      const where: { userId: string; category?: string } = { userId };
      if (category && category !== 'all') {
        where.category = category;
      }

      const playlists = await prisma.playlist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return playlists as Playlist[];
    },
    30 * 1000 // Cache for 30 seconds
  );
}

export async function getPlaylistWithVideos(
  userId: string,
  playlistId: string
): Promise<PlaylistWithVideos | null> {
  const result = await prisma.playlist.findFirst({
    where: {
      id: playlistId,
      userId,
    },
    include: {
      videos: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!result) return null;

  // Cast videos to ensure takeawaysStatus is typed correctly
  const videos: Video[] = result.videos.map(video => ({
    ...video,
    takeawaysStatus: video.takeawaysStatus as TakeawaysStatus | null,
  }));

  return {
    ...result,
    videos,
  } as PlaylistWithVideos;
}

export async function getPlaylistCategories(userId: string): Promise<string[]> {
  const cacheKey = `categories:${userId}`;

  return getCached(
    cacheKey,
    async () => {
      const playlists = await prisma.playlist.findMany({
        where: { userId },
        select: { category: true },
        distinct: ['category'],
      });

      return playlists.map((p) => p.category);
    },
    60 * 1000 // Cache for 1 minute
  );
}

export async function updatePlaylistProgress(playlistId: string): Promise<void> {
  const completedCount = await prisma.video.count({
    where: {
      playlistId,
      status: 'COMPLETED',
    },
  });

  await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      completedVideos: completedCount,
      lastWatchedAt: new Date(),
    },
  });
}
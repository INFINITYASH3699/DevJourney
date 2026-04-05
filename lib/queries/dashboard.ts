// lib/queries/dashboard.ts

import { prisma } from '@/lib/prisma';
import { getCached, invalidateUserCache } from '@/lib/cache';
import { DashboardStats, RecentVideo, CategoryProgress, TodayTarget } from '@/types';

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const cacheKey = `dashboard:${userId}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        // Parallel queries for performance
        const [
          playlistCount,
          videoStats,
          completedCount,
          watchingCount,
          user,
          categoriesRaw,
          weekProgress,
        ] = await Promise.all([
          // Count playlists
          prisma.playlist.count({ where: { userId } }),

          // Total videos
          prisma.video.count({
            where: { playlist: { userId } },
          }),

          // Completed videos
          prisma.video.count({
            where: {
              playlist: { userId },
              status: 'COMPLETED',
            },
          }),

          // Watching videos
          prisma.video.count({
            where: {
              playlist: { userId },
              status: 'WATCHING',
            },
          }),

          // User data
          prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true },
          }),

          // Category breakdown
          prisma.playlist.findMany({
            where: { userId },
            select: {
              category: true,
              totalVideos: true,
              completedVideos: true,
            },
          }),

          // Week progress
          prisma.video.count({
            where: {
              playlist: { userId },
              status: 'COMPLETED',
              completedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

        // Calculate category progress
        const categoryMap = new Map<
          string,
          { total: number; completed: number }
        >();

        for (const playlist of categoriesRaw) {
          const existing = categoryMap.get(playlist.category) || {
            total: 0,
            completed: 0,
          };
          existing.total += playlist.totalVideos;
          existing.completed += playlist.completedVideos;
          categoryMap.set(playlist.category, existing);
        }

        const categoriesProgress: CategoryProgress[] = Array.from(categoryMap.entries()).map(
          ([category, data]) => ({
            category,
            total: data.total,
            completed: data.completed,
            percentage:
              data.total > 0 ? (data.completed / data.total) * 100 : 0,
          })
        );

        const totalVideos = videoStats;
        const overallProgress =
          totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;

        const stats: DashboardStats = {
          totalPlaylists: playlistCount,
          totalVideos,
          completedVideos: completedCount,
          watchingVideos: watchingCount,
          overallProgress,
          weekProgress,
          streak: user?.streak || 0,
          categoriesProgress,
          todayTarget: null, // Will be fetched separately if needed
        };

        return stats;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return default stats on error
        return {
          totalPlaylists: 0,
          totalVideos: 0,
          completedVideos: 0,
          watchingVideos: 0,
          overallProgress: 0,
          weekProgress: 0,
          streak: 0,
          categoriesProgress: [],
          todayTarget: null,
        };
      }
    },
    60 * 1000 // Cache for 1 minute
  );
}

export async function getRecentActivity(userId: string): Promise<RecentVideo[]> {
  const cacheKey = `recent:${userId}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const videos = await prisma.video.findMany({
          where: {
            playlist: { userId },
            status: { in: ['WATCHING', 'COMPLETED'] },
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            playlistId: true,
            playlist: {
              select: {
                title: true,
                category: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        });

        return videos;
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    },
    30 * 1000 // Cache for 30 seconds
  );
}

export async function getOverduePlaylistsCount(userId: string): Promise<number> {
  try {
    const count = await prisma.playlist.count({
      where: {
        userId,
        isOverdue: true,
      },
    });
    
    return count;
  } catch (error) {
    console.error('Error fetching overdue playlists:', error);
    return 0;
  }
}

export function invalidateDashboardCache(userId: string): void {
  invalidateUserCache(userId);
}
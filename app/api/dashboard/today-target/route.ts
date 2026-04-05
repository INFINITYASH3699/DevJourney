// app/api/dashboard/today-target/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getTodayDayOfWeek, 
  getDaysUntil, 
  calculateDailyTarget,
  calculateTargetVideos,
} from '@/lib/utils';
import { DailySchedule, TodayTarget, PlaylistDailyTarget } from '@/types';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with schedule
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { dailySchedule: true },
    });

    const dailySchedule = user?.dailySchedule as DailySchedule | null;
    const todayDay = getTodayDayOfWeek();
    const todayAvailableMinutes = dailySchedule?.[todayDay] || 60;

    // Get playlists with targets
    const playlistsWithTargets = await prisma.playlist.findMany({
      where: {
        userId: session.id,
        targetDate: { not: null },
      },
      include: {
        videos: {
          select: {
            id: true,
            status: true,
            durationSeconds: true,
            completedAt: true,
          },
        },
      },
      orderBy: { targetDate: 'asc' },
    });

    if (playlistsWithTargets.length === 0) {
      return NextResponse.json(null);
    }

    // Calculate today's targets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let totalTargetMinutes = 0;
    let totalCompletedMinutes = 0;
    let totalTargetVideos = 0;
    let totalCompletedVideos = 0;

    const playlistTargets: PlaylistDailyTarget[] = [];

    for (const playlist of playlistsWithTargets) {
      const remainingVideos = playlist.videos.filter(v => v.status !== 'COMPLETED');
      const remainingSeconds = remainingVideos.reduce((sum, v) => sum + v.durationSeconds, 0);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      const remainingDays = Math.max(1, getDaysUntil(playlist.targetDate!));
      const isOverdue = new Date() > new Date(playlist.targetDate!);
      const daysOverdue = isOverdue ? Math.abs(getDaysUntil(playlist.targetDate!)) : 0;

      // Calculate daily targets for this playlist
      const dailyTargetMinutes = calculateDailyTarget(
        remainingMinutes, 
        remainingDays, 
        dailySchedule
      );
      const dailyTargetVideos = calculateTargetVideos(remainingVideos.length, remainingDays);

      // Calculate what was completed today
      const completedToday = playlist.videos.filter(v => 
        v.status === 'COMPLETED' && 
        v.completedAt && 
        new Date(v.completedAt) >= today &&
        new Date(v.completedAt) < tomorrow
      );
      const completedTodayMinutes = Math.ceil(
        completedToday.reduce((sum, v) => sum + v.durationSeconds, 0) / 60
      );

      totalTargetMinutes += dailyTargetMinutes;
      totalCompletedMinutes += completedTodayMinutes;
      totalTargetVideos += dailyTargetVideos;
      totalCompletedVideos += completedToday.length;

      playlistTargets.push({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        targetVideos: dailyTargetVideos,
        targetMinutes: dailyTargetMinutes,
        remainingDays,
        isOverdue,
        daysOverdue,
      });
    }

    // Sort by urgency (overdue first, then by remaining days)
    playlistTargets.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.remainingDays - b.remainingDays;
    });

    const response: TodayTarget = {
      totalMinutes: Math.min(totalTargetMinutes, todayAvailableMinutes),
      completedMinutes: totalCompletedMinutes,
      remainingMinutes: Math.max(0, totalTargetMinutes - totalCompletedMinutes),
      videosTarget: totalTargetVideos,
      videosCompleted: totalCompletedVideos,
      onTrack: totalCompletedMinutes >= totalTargetMinutes * 0.8, // 80% threshold
      playlists: playlistTargets,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching today target:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today target' },
      { status: 500 }
    );
  }
}
// app/api/playlists/[id]/target/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/cache';
import { getDaysUntil, calculateDailyTarget, calculateTargetVideos } from '@/lib/utils';
import { DailySchedule } from '@/types';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        videos: {
          select: {
            id: true,
            status: true,
            durationSeconds: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Get user's daily schedule
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { dailySchedule: true },
    });

    const dailySchedule = user?.dailySchedule as DailySchedule | null;

    // Calculate remaining content
    const remainingVideos = playlist.videos.filter(v => v.status !== 'COMPLETED');
    const remainingSeconds = remainingVideos.reduce((sum, v) => sum + v.durationSeconds, 0);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    let targetInfo = null;

    if (playlist.targetDate) {
      const remainingDays = Math.max(0, getDaysUntil(playlist.targetDate));
      const isOverdue = remainingDays === 0 && new Date() > new Date(playlist.targetDate);

      targetInfo = {
        targetDate: playlist.targetDate,
        remainingDays,
        isOverdue,
        daysOverdue: isOverdue ? Math.abs(getDaysUntil(playlist.targetDate)) : 0,
        remainingVideos: remainingVideos.length,
        remainingMinutes,
        dailyTargetMinutes: calculateDailyTarget(remainingMinutes, remainingDays, dailySchedule),
        dailyTargetVideos: calculateTargetVideos(remainingVideos.length, remainingDays),
        onTrack: !isOverdue && remainingDays > 0,
      };
    }

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        title: playlist.title,
        totalVideos: playlist.totalVideos,
        completedVideos: playlist.completedVideos,
        totalDuration: playlist.totalDuration,
      },
      target: targetInfo,
      dailySchedule,
    });
  } catch (error) {
    console.error('Error fetching playlist target:', error);
    return NextResponse.json(
      { error: 'Failed to fetch target info' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { targetDate, dailyTarget, targetVideos, clearTarget } = body;

    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        videos: {
          select: {
            id: true,
            status: true,
            durationSeconds: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Clear target
    if (clearTarget) {
      await prisma.playlist.update({
        where: { id },
        data: {
          targetDate: null,
          dailyTarget: null,
          targetVideos: null,
          isOverdue: false,
          overdueFrom: null,
        },
      });

      invalidateUserCache(session.id);
      return NextResponse.json({ success: true, message: 'Target cleared' });
    }

    // Set new target
    const updateData: Record<string, unknown> = {};

    if (targetDate) {
      updateData.targetDate = new Date(targetDate);
      
      // Check if setting to a past date
      if (new Date(targetDate) < new Date()) {
        updateData.isOverdue = true;
        updateData.overdueFrom = new Date();
      } else {
        updateData.isOverdue = false;
        updateData.overdueFrom = null;
      }
    }

    if (dailyTarget !== undefined) {
      updateData.dailyTarget = dailyTarget;
    }

    if (targetVideos !== undefined) {
      updateData.targetVideos = targetVideos;
    }

    // Auto-calculate daily targets if targetDate is set but dailyTarget is not
    if (targetDate && dailyTarget === undefined) {
      const remainingDays = Math.max(1, getDaysUntil(new Date(targetDate)));
      const remainingVideos = playlist.videos.filter(v => v.status !== 'COMPLETED');
      const remainingSeconds = remainingVideos.reduce((sum, v) => sum + v.durationSeconds, 0);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      // Get user's schedule for smart calculation
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { dailySchedule: true },
      });

      const dailySchedule = user?.dailySchedule as DailySchedule | null;
      
      updateData.dailyTarget = calculateDailyTarget(remainingMinutes, remainingDays, dailySchedule);
      updateData.targetVideos = calculateTargetVideos(remainingVideos.length, remainingDays);
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: updateData,
    });

    invalidateUserCache(session.id);

    return NextResponse.json({
      success: true,
      playlist: updated,
    });
  } catch (error) {
    console.error('Error updating playlist target:', error);
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    );
  }
}
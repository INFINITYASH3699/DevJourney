// app/api/users/schedule/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/cache';
import { DailySchedule } from '@/types';
import { DEFAULT_DAILY_SCHEDULE } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        dailySchedule: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      dailySchedule: user.dailySchedule || DEFAULT_DAILY_SCHEDULE,
      preferences: user.preferences || {},
    });
  } catch (error) {
    console.error('Error fetching user schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dailySchedule, preferences } = body;

    const updateData: Record<string, unknown> = {};

    if (dailySchedule) {
      // Validate schedule format
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const isValidSchedule = validDays.every(day => 
        typeof dailySchedule[day] === 'number' && 
        dailySchedule[day] >= 0 && 
        dailySchedule[day] <= 1440 // Max 24 hours in minutes
      );

      if (!isValidSchedule) {
        return NextResponse.json({ error: 'Invalid schedule format' }, { status: 400 });
      }

      updateData.dailySchedule = dailySchedule;
    }

    if (preferences) {
      updateData.preferences = preferences;
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    // Recalculate all playlist targets based on new schedule
    if (dailySchedule) {
      const playlistsWithTargets = await prisma.playlist.findMany({
        where: {
          userId: session.id,
          targetDate: { not: null },
        },
        include: {
          videos: {
            select: {
              status: true,
              durationSeconds: true,
            },
          },
        },
      });

      // Update each playlist's daily targets
      for (const playlist of playlistsWithTargets) {
        const remainingVideos = playlist.videos.filter(v => v.status !== 'COMPLETED');
        const remainingSeconds = remainingVideos.reduce((sum, v) => sum + v.durationSeconds, 0);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        const remainingDays = Math.max(1, Math.ceil((new Date(playlist.targetDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        await prisma.playlist.update({
          where: { id: playlist.id },
          data: {
            dailyTarget: Math.ceil(remainingMinutes / remainingDays),
            targetVideos: Math.ceil(remainingVideos.length / remainingDays),
          },
        });
      }
    }

    invalidateUserCache(session.id);

    return NextResponse.json({
      success: true,
      dailySchedule: updated.dailySchedule,
      preferences: updated.preferences,
    });
  } catch (error) {
    console.error('Error updating user schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
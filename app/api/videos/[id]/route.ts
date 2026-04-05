// app/api/videos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateUserActivity } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/cache';

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

    const video = await prisma.video.findFirst({
      where: {
        id,
        playlist: { userId: session.id },
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
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, needsPractice, practiceNotes, watchProgress } = body;

    // Verify ownership
    const video = await prisma.video.findFirst({
      where: {
        id,
        playlist: { userId: session.id },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;

      if (status === 'WATCHING') {
        updateData.lastWatchedAt = new Date();
      } else if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.lastWatchedAt = new Date();
        // Reset watch progress when completed
        updateData.watchProgress = 0;
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (needsPractice !== undefined) updateData.needsPractice = needsPractice;
    if (practiceNotes !== undefined) updateData.practiceNotes = practiceNotes;
    
    // NEW: Update watch progress for resume functionality
    if (watchProgress !== undefined) {
      updateData.watchProgress = watchProgress;
      updateData.lastWatchedAt = new Date();
      
      // Auto-mark as watching if progress is being saved
      if (video.status === 'NOT_STARTED' && watchProgress > 0) {
        updateData.status = 'WATCHING';
      }
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: updateData,
    });

    // Update playlist completed count and last watched
    if (status || watchProgress !== undefined) {
      const completedCount = await prisma.video.count({
        where: {
          playlistId: video.playlistId,
          status: 'COMPLETED',
        },
      });

      await prisma.playlist.update({
        where: { id: video.playlistId },
        data: {
          completedVideos: completedCount,
          lastWatchedAt: new Date(),
        },
      });
    }

    // Update user activity and total watch time
    if (watchProgress !== undefined && watchProgress > video.watchProgress) {
      const watchedSeconds = watchProgress - video.watchProgress;
      await prisma.user.update({
        where: { id: session.id },
        data: {
          totalWatchTime: { increment: watchedSeconds },
          lastActive: new Date(),
        },
      });
    }

    // Update user activity
    await updateUserActivity(session.id);

    // Invalidate cache
    invalidateUserCache(session.id);

    return NextResponse.json(updatedVideo);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}
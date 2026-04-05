// app/api/videos/[id]/progress/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { currentTime } = body;

    if (typeof currentTime !== 'number') {
      return NextResponse.json({ error: 'Invalid progress time' }, { status: 400 });
    }

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

    // Only update if new progress is greater (avoid backwards seeking issues)
    const newProgress = Math.floor(currentTime);
    
    const updateData: Record<string, unknown> = {
      lastWatchedAt: new Date(),
    };

    // Save progress only if it's a meaningful update
    if (newProgress > video.watchProgress || newProgress === 0) {
      updateData.watchProgress = newProgress;
    }

    // Auto-mark as watching if not started
    if (video.status === 'NOT_STARTED' && newProgress > 10) {
      updateData.status = 'WATCHING';
    }

    // Check if video is nearly complete (within 30 seconds of end)
    const isNearEnd = video.durationSeconds > 0 && 
      (video.durationSeconds - newProgress) < 30;
    
    if (isNearEnd && video.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
      updateData.watchProgress = 0; // Reset for rewatching
    }

    await prisma.video.update({
      where: { id },
      data: updateData,
    });

    // Update playlist if status changed
    if (updateData.status === 'COMPLETED') {
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

    return NextResponse.json({ 
      success: true, 
      progress: updateData.watchProgress ?? video.watchProgress,
      status: updateData.status ?? video.status 
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
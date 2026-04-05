// app/api/playlists/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        videos: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Calculate total duration if not set
    if (!playlist.totalDuration) {
      const totalDuration = playlist.videos.reduce((sum, v) => sum + v.durationSeconds, 0);
      await prisma.playlist.update({
        where: { id },
        data: { totalDuration },
      });
      playlist.totalDuration = totalDuration;
    }

    // Check and update overdue status
    if (playlist.targetDate && !playlist.isOverdue) {
      const isOverdue = new Date() > new Date(playlist.targetDate);
      if (isOverdue) {
        await prisma.playlist.update({
          where: { id },
          data: {
            isOverdue: true,
            overdueFrom: new Date(),
          },
        });
        playlist.isOverdue = true;
        playlist.overdueFrom = new Date();
      }
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
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
    const { category, targetDate, dailyTarget, targetVideos } = body;

    // Verify ownership
    const playlist = await prisma.playlist.findFirst({
      where: {
        id,
        userId: session.id,
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (category) updateData.category = category;
    if (targetDate !== undefined) {
      updateData.targetDate = targetDate ? new Date(targetDate) : null;
      if (targetDate && new Date(targetDate) < new Date()) {
        updateData.isOverdue = true;
        updateData.overdueFrom = new Date();
      } else {
        updateData.isOverdue = false;
        updateData.overdueFrom = null;
      }
    }
    if (dailyTarget !== undefined) updateData.dailyTarget = dailyTarget;
    if (targetVideos !== undefined) updateData.targetVideos = targetVideos;

    const updated = await prisma.playlist.update({
      where: { id },
      data: updateData,
    });

    invalidateUserCache(session.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete only if user owns this playlist
    const deleted = await prisma.playlist.deleteMany({
      where: {
        id,
        userId: session.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Invalidate cache
    invalidateUserCache(session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
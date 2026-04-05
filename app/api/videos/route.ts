import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const needsPractice = searchParams.get('needsPractice');
    const status = searchParams.get('status');
    const playlistId = searchParams.get('playlistId');
    const limit = searchParams.get('limit');

    // Build where clause
    const where: Record<string, unknown> = {
      playlist: { userId: session.id },
    };

    if (needsPractice === 'true') {
      where.needsPractice = true;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (playlistId) {
      where.playlistId = playlistId;
    }

    const videos = await prisma.video.findMany({
      where,
      include: {
        playlist: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { position: 'asc' }],
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
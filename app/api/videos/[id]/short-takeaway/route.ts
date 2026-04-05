// app/api/videos/[id]/short-takeaway/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCardTakeaway } from '@/lib/openai';

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

    // Verify ownership and get video details
    const video = await prisma.video.findFirst({
      where: {
        id,
        playlist: { userId: session.id },
      },
      include: {
        playlist: {
          select: {
            category: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate card takeaway (meaningful short summary)
    const cardTakeaway = await generateCardTakeaway(
      video.title,
      video.description || '',
      video.playlist.category
    );

    if (!cardTakeaway) {
      return NextResponse.json(
        { error: 'Failed to generate takeaway' },
        { status: 500 }
      );
    }

    // Save to database as JSON string
    const takeawayJson = JSON.stringify(cardTakeaway);

    await prisma.video.update({
      where: { id },
      data: { shortTakeaway: takeawayJson },
    });

    return NextResponse.json({
      shortTakeaway: takeawayJson,
      success: true,
    });
  } catch (error) {
    console.error('Error generating card takeaway:', error);
    return NextResponse.json(
      { error: 'Failed to generate takeaway' },
      { status: 500 }
    );
  }
}
// app/api/videos/[id]/takeaways/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEnhancedTakeaways } from '@/lib/openai';

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
      select: {
        aiTakeaways: true,
        shortTakeaway: true,
        takeawaysStatus: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({
      takeaways: video.aiTakeaways,
      shortTakeaway: video.shortTakeaway,
      status: video.takeawaysStatus,
    });
  } catch (error) {
    console.error('Error fetching takeaways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch takeaways' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get('regenerate') === 'true';

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

    // Return existing if available and not forcing regeneration
    if (video.aiTakeaways && !forceRegenerate) {
      return NextResponse.json({
        takeaways: video.aiTakeaways,
        shortTakeaway: video.shortTakeaway,
        status: 'completed',
      });
    }

    // Mark as generating
    await prisma.video.update({
      where: { id },
      data: { takeawaysStatus: 'generating' },
    });

    // Generate enhanced takeaways
    const takeaways = await generateEnhancedTakeaways(
      video.title,
      video.description || '',
      video.playlist.category
    );

    if (!takeaways) {
      await prisma.video.update({
        where: { id },
        data: { takeawaysStatus: 'error' },
      });

      return NextResponse.json(
        { error: 'Failed to generate takeaways' },
        { status: 500 }
      );
    }

    const takeawaysJson = JSON.stringify(takeaways);
    const shortTakeaway = takeaways.shortSummary || takeaways.summary.slice(0, 150);

    // Save to database
    await prisma.video.update({
      where: { id },
      data: {
        aiTakeaways: takeawaysJson,
        shortTakeaway: shortTakeaway,
        takeawaysStatus: 'completed',
      },
    });

    return NextResponse.json({
      takeaways: takeawaysJson,
      shortTakeaway: shortTakeaway,
      status: 'completed',
    });
  } catch (error) {
    console.error('Error generating takeaways:', error);
    return NextResponse.json(
      { error: 'Failed to generate takeaways' },
      { status: 500 }
    );
  }
}
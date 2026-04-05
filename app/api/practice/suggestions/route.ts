import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePracticeSuggestions } from '@/lib/openai';

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recently completed videos
    const completedVideos = await prisma.video.findMany({
      where: {
        playlist: { userId: session.id },
        status: 'COMPLETED',
      },
      include: {
        playlist: {
          select: {
            category: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    if (completedVideos.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'Complete some videos first to get practice suggestions',
      });
    }

    const suggestions = await generatePracticeSuggestions(
      completedVideos.map((v) => ({
        title: v.title,
        description: v.description || '',
        category: v.playlist.category,
      }))
    );

    return NextResponse.json({
      suggestions,
      basedOn: completedVideos.length,
      categories: [...new Set(completedVideos.map((v) => v.playlist.category))],
    });
  } catch (error) {
    console.error('Error generating practice suggestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        suggestions: [],
      },
      { status: 500 }
    );
  }
}
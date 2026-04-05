import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  extractPlaylistId,
  fetchPlaylistDetails,
  fetchPlaylistVideos,
  getVideoDurations,
} from '@/lib/youtube';
import { invalidateUserCache } from '@/lib/cache';
import { z } from 'zod';

const createPlaylistSchema = z.object({
  url: z.string().url('Invalid URL'),
  category: z.string().min(1, 'Category is required'),
});

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(playlists, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const result = createPlaylistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { url, category } = result.data;

    // Extract playlist ID
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Invalid YouTube playlist URL' },
        { status: 400 }
      );
    }

    // Check if already added
    const existing = await prisma.playlist.findUnique({
      where: { playlistId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Playlist already added' },
        { status: 400 }
      );
    }

    // Fetch playlist details from YouTube
    const playlistDetails = await fetchPlaylistDetails(playlistId);
    if (!playlistDetails) {
      return NextResponse.json(
        { error: 'Could not find playlist. Make sure it is public.' },
        { status: 404 }
      );
    }

    // Fetch videos
    const videos = await fetchPlaylistVideos(playlistId);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'Playlist has no accessible videos' },
        { status: 400 }
      );
    }

    // Get video durations
    const videoIds = videos.map((v) => v.videoId);
    const durations = await getVideoDurations(videoIds);

    // Create playlist with videos
    const playlist = await prisma.playlist.create({
      data: {
        userId: session.id,
        playlistId,
        title: playlistDetails.title,
        description: playlistDetails.description,
        category,
        thumbnailUrl: playlistDetails.thumbnailUrl,
        totalVideos: videos.length,
        completedVideos: 0,
        videos: {
          create: videos.map((video) => ({
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            thumbnailUrl: video.thumbnailUrl,
            duration: durations[video.videoId]?.duration || null,
            durationSeconds: durations[video.videoId]?.durationSeconds || 0,
            position: video.position,
            status: 'NOT_STARTED',
          })),
        },
      },
      include: {
        videos: true,
      },
    });

    // Invalidate cache
    invalidateUserCache(session.id);

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add playlist' },
      { status: 500 }
    );
  }
}
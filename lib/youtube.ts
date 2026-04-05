import axios, { AxiosResponse } from 'axios';
import { getCached } from './cache';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  position: number;
  duration?: string;
  durationSeconds?: number;
}

export interface YouTubePlaylist {
  playlistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  totalVideos: number;
}

interface YouTubePlaylistResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        medium?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails: {
      itemCount: number;
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      position: number;
      thumbnails: {
        medium?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails: {
      videoId: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideosResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
  }>;
}

export function extractPlaylistId(url: string): string | null {
  const patterns = [/[?&]list=([^&]+)/, /playlist\?list=([^&]+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function fetchPlaylistDetails(
  playlistId: string
): Promise<YouTubePlaylist | null> {
  const cacheKey = `youtube:playlist:${playlistId}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const response: AxiosResponse<YouTubePlaylistResponse> = await axios.get(
          `${YOUTUBE_API_BASE}/playlists`,
          {
            params: {
              part: 'snippet,contentDetails',
              id: playlistId,
              key: YOUTUBE_API_KEY,
            },
          }
        );

        if (response.data.items.length === 0) return null;

        const item = response.data.items[0];
        return {
          playlistId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl:
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url ||
            '',
          totalVideos: item.contentDetails.itemCount,
        };
      } catch (error) {
        console.error('Error fetching playlist details:', error);
        return null;
      }
    },
    60 * 60 * 1000 // Cache for 1 hour
  );
}

export async function fetchPlaylistVideos(
  playlistId: string
): Promise<YouTubeVideo[]> {
  const cacheKey = `youtube:videos:${playlistId}`;

  return getCached(
    cacheKey,
    async () => {
      try {
        const videos: YouTubeVideo[] = [];
        let nextPageToken: string | undefined = undefined;

        do {
          const response: AxiosResponse<YouTubePlaylistItemsResponse> =
            await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
              params: {
                part: 'snippet,contentDetails',
                maxResults: 50,
                playlistId,
                pageToken: nextPageToken,
                key: YOUTUBE_API_KEY,
              },
            });

          for (const item of response.data.items) {
            // Skip deleted/private videos
            if (
              item.snippet.title === 'Deleted video' ||
              item.snippet.title === 'Private video'
            ) {
              continue;
            }

            videos.push({
              videoId: item.contentDetails.videoId,
              title: item.snippet.title,
              description: item.snippet.description || '',
              thumbnailUrl:
                item.snippet.thumbnails.medium?.url ||
                item.snippet.thumbnails.default?.url ||
                '',
              position: item.snippet.position,
            });
          }

          nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        return videos;
      } catch (error) {
        console.error('Error fetching playlist videos:', error);
        return [];
      }
    },
    60 * 60 * 1000 // Cache for 1 hour
  );
}

export async function getVideoDurations(
  videoIds: string[]
): Promise<Record<string, { duration: string; durationSeconds: number }>> {
  if (videoIds.length === 0) return {};

  try {
    const durations: Record<string, { duration: string; durationSeconds: number }> = {};

    // Split into chunks of 50 (API limit)
    const chunks: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      chunks.push(videoIds.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const response: AxiosResponse<YouTubeVideosResponse> = await axios.get(
        `${YOUTUBE_API_BASE}/videos`,
        {
          params: {
            part: 'contentDetails',
            id: chunk.join(','),
            key: YOUTUBE_API_KEY,
          },
        }
      );

      for (const item of response.data.items) {
        const duration = item.contentDetails.duration;
        durations[item.id] = {
          duration,
          durationSeconds: parseDurationToSeconds(duration),
        };
      }
    }

    return durations;
  } catch (error) {
    console.error('Error fetching video durations:', error);
    return {};
  }
}

function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export function parseDuration(duration: string): string {
  if (!duration) return '0:00';

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    if (duration.includes(':')) return duration;
    return '0:00';
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
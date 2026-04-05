'use client';

import { PlaylistCard } from './playlist-card';
import { Playlist } from '@/types';

interface PlaylistGridProps {
  playlists: Playlist[];
}

export function PlaylistGrid({ playlists }: PlaylistGridProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
}
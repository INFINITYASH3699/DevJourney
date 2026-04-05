'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ListVideo, Plus } from 'lucide-react';
import { AddPlaylistDialog } from './add-playlist-dialog';

interface PlaylistsEmptyStateProps {
  hasFilter?: boolean;
}

export function PlaylistsEmptyState({ hasFilter = false }: PlaylistsEmptyStateProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ListVideo className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {hasFilter ? 'No playlists in this category' : 'No playlists yet'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          {hasFilter
            ? 'Try selecting a different category or add a new playlist.'
            : 'Add your first YouTube playlist to start tracking your learning progress.'}
        </p>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Playlist
        </Button>
      </div>

      <AddPlaylistDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
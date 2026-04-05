'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddPlaylistDialog } from './add-playlist-dialog';

export function AddPlaylistButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Playlist</span>
        <span className="sm:hidden">Add</span>
      </Button>
      <AddPlaylistDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
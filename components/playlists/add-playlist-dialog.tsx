'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Youtube } from 'lucide-react';

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  'Web Development',
  'AI/ML',
  'UI/UX',
  'Backend',
  'Frontend',
  'Database',
  'DevOps',
  'Mobile',
  'Other',
];

export function AddPlaylistDialog({ open, onOpenChange }: AddPlaylistDialogProps) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add playlist');
      }

      toast.success('Playlist added!', {
        description: `${data.videos?.length || 0} videos imported successfully`,
      });

      setUrl('');
      setCategory('');
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error('Failed to add playlist', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Add YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube playlist URL to start tracking your learning
            progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Playlist URL</Label>
              <Input
                id="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Copy the URL from a public YouTube playlist
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !url || !category}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Playlist'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
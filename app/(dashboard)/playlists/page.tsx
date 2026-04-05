import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPlaylists, getPlaylistCategories } from '@/lib/queries/playlists';
import { PlaylistGrid } from '@/components/playlists/playlist-grid';
import { AddPlaylistButton } from '@/components/playlists/add-playlist-button';
import { CategoryFilter } from '@/components/playlists/category-filter';
import { PlaylistsEmptyState } from '@/components/playlists/playlists-empty-state';
import { Suspense } from 'react';
import { PlaylistGridSkeleton } from '@/components/shared/skeleton-loader';

interface PlaylistsPageProps {
  searchParams: Promise<{ category?: string }>;
}

async function PlaylistsContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const params = await searchParams;
  const [playlists, categories] = await Promise.all([
    getPlaylists(user.id, params.category),
    getPlaylistCategories(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Playlists</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Manage and track your learning playlists
          </p>
        </div>
        <AddPlaylistButton />
      </div>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <CategoryFilter
            categories={categories}
            currentCategory={params.category}
          />
          <p className="text-sm text-muted-foreground">
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
            {params.category && params.category !== 'all'
              ? ` in ${params.category}`
              : ''}
          </p>
        </div>
      )}

      {/* Playlist Grid or Empty State */}
      {playlists.length === 0 ? (
        <PlaylistsEmptyState
          hasFilter={!!params.category && params.category !== 'all'}
        />
      ) : (
        <PlaylistGrid playlists={playlists} />
      )}
    </div>
  );
}

export default function PlaylistsPage({ searchParams }: PlaylistsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
          <PlaylistGridSkeleton />
        </div>
      }
    >
      <PlaylistsContent searchParams={searchParams} />
    </Suspense>
  );
}
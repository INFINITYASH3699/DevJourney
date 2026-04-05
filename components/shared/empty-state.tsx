import { Button } from '@/components/ui/button';
import {
  ListVideo,
  Target,
  Dumbbell,
  PlayCircle,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';

type EmptyStateType =
  | 'playlists'
  | 'videos'
  | 'milestones'
  | 'practice'
  | 'completed'
  | 'search';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const defaultConfig: Record<
  EmptyStateType,
  {
    icon: typeof ListVideo;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }
> = {
  playlists: {
    icon: ListVideo,
    title: 'No playlists yet',
    description: 'Add your first YouTube playlist to start tracking your learning progress.',
    actionLabel: 'Add Playlist',
    actionHref: '/playlists',
  },
  videos: {
    icon: PlayCircle,
    title: 'No videos found',
    description: 'This playlist has no videos or all videos are filtered out.',
    actionLabel: 'Clear Filters',
    actionHref: '',
  },
  milestones: {
    icon: Target,
    title: 'No milestones yet',
    description: 'Set your first learning goal to track your progress.',
    actionLabel: 'Add Milestone',
    actionHref: '/milestones',
  },
  practice: {
    icon: Dumbbell,
    title: 'No videos marked for practice',
    description: 'While watching videos, mark the ones you want to practice later.',
    actionLabel: 'Browse Playlists',
    actionHref: '/playlists',
  },
  completed: {
    icon: PlayCircle,
    title: 'No completed videos yet',
    description: 'Start learning by watching videos from your playlists!',
    actionLabel: 'Go to Playlists',
    actionHref: '/playlists',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    actionLabel: 'Clear Search',
    actionHref: '',
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const Icon = config.icon;

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel || config.actionLabel;
  const finalActionHref = actionHref ?? config.actionHref;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{finalTitle}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {finalDescription}
      </p>
      {(finalActionHref || onAction) && (
        <>
          {onAction ? (
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-2" />
              {finalActionLabel}
            </Button>
          ) : (
            <Link href={finalActionHref}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {finalActionLabel}
              </Button>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
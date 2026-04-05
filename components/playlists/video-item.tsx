// components/playlists/video-item.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, VideoStatus, CardTakeaway } from '@/types';
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  MoreVertical,
  Sparkles,
  ExternalLink,
  BookOpen,
  Target,
  Loader2,
  Clock,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseDuration, secondsToTimestamp } from '@/lib/utils';
import { VideoPlayerModal } from '@/components/shared/video-player-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoItemProps {
  video: Video;
}

const statusConfig: Record<
  VideoStatus,
  { icon: typeof Circle; color: string; bg: string; label: string }
> = {
  NOT_STARTED: {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    label: 'Not Started',
  },
  WATCHING: {
    icon: PlayCircle,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Watching',
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Completed',
  },
};

const difficultyConfig = {
  beginner: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Beginner' },
  intermediate: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Intermediate' },
  advanced: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Advanced' },
};

export function VideoItem({ video }: VideoItemProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [generatingTakeaway, setGeneratingTakeaway] = useState(false);
  const [cardTakeaway, setCardTakeaway] = useState<CardTakeaway | null>(() => {
    // Parse existing takeaway from video
    if (video.shortTakeaway) {
      try {
        return JSON.parse(video.shortTakeaway);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [showFullTakeaway, setShowFullTakeaway] = useState(false);
  const router = useRouter();

  const config = statusConfig[video.status];
  const StatusIcon = config.icon;

  const updateStatus = async (newStatus: VideoStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success(
        `Video marked as ${newStatus.toLowerCase().replace('_', ' ')}`
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update video status');
    } finally {
      setUpdating(false);
    }
  };

  const togglePractice = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPractice: !video.needsPractice }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success(
        video.needsPractice
          ? 'Removed from practice list'
          : 'Added to practice list'
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update practice status');
    } finally {
      setUpdating(false);
    }
  };

  // Generate Card Takeaway (meaningful short summary)
  const generateCardTakeaway = async () => {
    setGeneratingTakeaway(true);
    try {
      const response = await fetch(`/api/videos/${video.id}/short-takeaway`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to generate');

      const parsed = JSON.parse(data.shortTakeaway);
      setCardTakeaway(parsed);
      setShowFullTakeaway(true);
      toast.success('Takeaway generated!');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate takeaway');
    } finally {
      setGeneratingTakeaway(false);
    }
  };

  // Calculate resume position display
  const hasProgress = video.watchProgress > 0 && video.status !== 'COMPLETED';
  const progressPercent =
    video.durationSeconds > 0
      ? (video.watchProgress / video.durationSeconds) * 100
      : 0;

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Thumbnail - Clickable */}
            <div
              className="relative w-24 h-16 sm:w-40 sm:h-24 flex-shrink-0 bg-muted rounded overflow-hidden cursor-pointer"
              onClick={() => setShowPlayer(true)}
            >
              {video.thumbnailUrl ? (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, 160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
              )}

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {hasProgress ? (
                  <div className="text-center">
                    <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-white mx-auto" />
                    <span className="text-white text-xs mt-1 block">Resume</span>
                  </div>
                ) : (
                  <PlayCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                )}
              </div>

              {/* Duration */}
              {video.duration && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="text-[10px] sm:text-xs">
                    {parseDuration(video.duration)}
                  </span>
                </div>
              )}

              {/* Resume progress indicator */}
              {hasProgress && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Resume timestamp */}
              {hasProgress && (
                <div className="absolute top-1 left-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                  ▶ {secondsToTimestamp(video.watchProgress)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setShowPlayer(true)}
                  >
                    {video.title}
                  </h3>

                  {/* Badges - Mobile Responsive */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-2">
                    <Badge
                      className={`${config.bg} text-xs`}
                      variant="secondary"
                    >
                      <StatusIcon
                        className={`h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 ${config.color}`}
                      />
                      <span className="hidden sm:inline">{config.label}</span>
                      <span className="sm:hidden">
                        {config.label.split(' ')[0]}
                      </span>
                    </Badge>

                    {video.needsPractice && (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs"
                      >
                        <Target className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                        <span className="hidden sm:inline">Practice</span>
                      </Badge>
                    )}

                    {video.notes && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs hidden sm:flex"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        Notes
                      </Badge>
                    )}

                    {cardTakeaway && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs"
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Takeaway</span>
                      </Badge>
                    )}

                    {video.aiTakeaways && (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-xs hidden sm:flex"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Details
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hidden sm:flex"
                    onClick={() => setShowPlayer(true)}
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={updating || generatingTakeaway}
                      >
                        {updating || generatingTakeaway ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {/* Status Options */}
                      <DropdownMenuItem
                        onClick={() => updateStatus('NOT_STARTED')}
                      >
                        <Circle className="h-4 w-4 mr-2 text-gray-400" />
                        Not Started
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus('WATCHING')}
                      >
                        <PlayCircle className="h-4 w-4 mr-2 text-orange-500" />
                        Watching
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateStatus('COMPLETED')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Completed
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Practice Toggle */}
                      <DropdownMenuItem onClick={togglePractice}>
                        <Target className="h-4 w-4 mr-2" />
                        {video.needsPractice
                          ? 'Remove from Practice'
                          : 'Mark for Practice'}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* CARD TAKEAWAY GENERATION */}
                      <DropdownMenuItem
                        onClick={generateCardTakeaway}
                        disabled={generatingTakeaway}
                        className="bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900"
                      >
                        <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                        {generatingTakeaway ? (
                          'Generating...'
                        ) : cardTakeaway ? (
                          'Regenerate Takeaway'
                        ) : (
                          'Generate Takeaway'
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Watch Video */}
                      <DropdownMenuItem onClick={() => setShowPlayer(true)}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {hasProgress
                          ? `Resume at ${secondsToTimestamp(video.watchProgress)}`
                          : 'Watch Video'}
                      </DropdownMenuItem>

                      {/* Open in YouTube */}
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in YouTube
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* CARD TAKEAWAY DISPLAY - Rich Format */}
              {cardTakeaway && (
                <div className="mt-3">
                  <CardTakeawayDisplay 
                    takeaway={cardTakeaway} 
                    isExpanded={showFullTakeaway}
                    onToggle={() => setShowFullTakeaway(!showFullTakeaway)}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        video={video}
        onStatusChange={() => router.refresh()}
      />
    </>
  );
}

// ============================================
// Card Takeaway Display Component
// ============================================

interface CardTakeawayDisplayProps {
  takeaway: CardTakeaway;
  isExpanded: boolean;
  onToggle: () => void;
}

function CardTakeawayDisplay({ takeaway, isExpanded, onToggle }: CardTakeawayDisplayProps) {
  const diffConfig = takeaway.difficulty ? difficultyConfig[takeaway.difficulty] : null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div 
        className="px-3 py-2 flex items-start gap-2 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
        onClick={onToggle}
      >
        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-snug">
            {takeaway.headline}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {diffConfig && (
            <Badge className={`${diffConfig.color} text-[10px] px-1.5 py-0`}>
              {diffConfig.label}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-200 dark:border-amber-800 pt-2">
          {/* Key Insights */}
          {takeaway.keyInsights && takeaway.keyInsights.length > 0 && (
            <div className="space-y-1.5">
              {takeaway.keyInsights.map((insight, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200"
                >
                  <Zap className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Tip */}
          {takeaway.quickTip && (
            <div className="bg-amber-100 dark:bg-amber-900/50 rounded px-2 py-1.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <span className="text-amber-500">💡</span>
              <span className="italic">{takeaway.quickTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// components/shared/video-player-modal.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  PlayCircle,
  Circle,
  Target,
  Sparkles,
  BookOpen,
  ExternalLink,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  Code,
  Table,
  ArrowRight,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { Video, VideoWithPlaylist, VideoStatus, EnhancedTakeaways } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { secondsToTimestamp } from '@/lib/utils';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | VideoWithPlaylist;
  onStatusChange?: () => void;
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

// YouTube Player API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  pauseVideo: () => void;
  playVideo: () => void;
  destroy: () => void;
}

export function VideoPlayerModal({
  isOpen,
  onClose,
  video,
  onStatusChange,
}: VideoPlayerModalProps) {
  const [status, setStatus] = useState<VideoStatus>(video.status);
  const [notes, setNotes] = useState(video.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTakeaways, setLoadingTakeaways] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [detailedTakeaways, setDetailedTakeaways] = useState<string | null>(video.aiTakeaways);
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [useIframeAPI, setUseIframeAPI] = useState(true);
  const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<string>(`youtube-player-${Date.now()}`);
  const router = useRouter();

  // Reset state when video changes
  useEffect(() => {
    setStatus(video.status);
    setNotes(video.notes || '');
    setDetailedTakeaways(video.aiTakeaways);
    setShowNotes(false);
    setShowTakeaways(false);
    setIsPlayerReady(false);
    setPlayer(null);
    setLoadingTakeaways(false);
    setIsRegenerating(false);
    playerContainerRef.current = `youtube-player-${Date.now()}`;
  }, [video.id]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isOpen || !useIframeAPI) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (player) {
        try {
          player.destroy();
        } catch (e) {
          // Ignore
        }
      }

      const startTime = video.watchProgress || 0;

      try {
        const newPlayer = new window.YT.Player(playerContainerRef.current, {
          videoId: video.videoId,
          playerVars: {
            start: startTime,
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target);
              setIsPlayerReady(true);

              progressSaveInterval.current = setInterval(() => {
                saveProgress(event.target);
              }, 10000);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                handleVideoComplete();
              }
              if (event.data === window.YT.PlayerState.PAUSED) {
                saveProgress(event.target);
              }
            },
          },
        });

        setPlayer(newPlayer);
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        setUseIframeAPI(false);
      }
    };

    if (window.YT && window.YT.Player) {
      setTimeout(initPlayer, 100);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = initPlayer;

    return () => {
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
  }, [isOpen, video.videoId, useIframeAPI]);

  const saveProgress = async (ytPlayer: YTPlayer) => {
    try {
      const currentTime = Math.floor(ytPlayer.getCurrentTime());

      await fetch(`/api/videos/${video.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleVideoComplete = async () => {
    try {
      await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      setStatus('COMPLETED');
      toast.success('Video completed! 🎉');
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  };

  const handleClose = useCallback(() => {
    if (player && isPlayerReady) {
      try {
        saveProgress(player);
        player.pauseVideo();
      } catch (e) {
        // Player might already be destroyed
      }
    }

    if (progressSaveInterval.current) {
      clearInterval(progressSaveInterval.current);
    }

    onClose();
  }, [player, isPlayerReady, onClose]);

  useEffect(() => {
    if (isOpen && status === 'NOT_STARTED') {
      updateStatus('WATCHING');
    }
  }, [isOpen]);

  const updateStatus = async (newStatus: VideoStatus) => {
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setStatus(newStatus);
      toast.success(
        `Video marked as ${newStatus.toLowerCase().replace('_', ' ')}`
      );
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update video status');
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Notes saved');
      setShowNotes(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const markForPractice = async () => {
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsPractice: true }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Added to practice list');
      onStatusChange?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark for practice');
    }
  };

  // Generate DETAILED takeaways (for modal display)
  // forceRegenerate: boolean - whether to force regeneration even if takeaways exist
  const generateDetailedTakeaways = async (forceRegenerate: boolean = false) => {
    setLoadingTakeaways(true);
    setIsRegenerating(forceRegenerate);
    
    try {
      // Add ?regenerate=true query param to force regeneration
      const url = forceRegenerate 
        ? `/api/videos/${video.id}/takeaways?regenerate=true`
        : `/api/videos/${video.id}/takeaways`;
      
      const response = await fetch(url, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Update state with new takeaways
      setDetailedTakeaways(data.takeaways);
      setShowTakeaways(true);
      
      toast.success(
        forceRegenerate 
          ? 'AI takeaways regenerated successfully!' 
          : 'Detailed AI takeaways generated!'
      );
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate takeaways');
    } finally {
      setLoadingTakeaways(false);
      setIsRegenerating(false);
    }
  };

  // Safely parse takeaways
  const parsedTakeaways: EnhancedTakeaways | null = (() => {
    if (!detailedTakeaways) return null;

    try {
      return JSON.parse(detailedTakeaways);
    } catch (error) {
      console.error('Error parsing takeaways:', error);
      return null;
    }
  })();

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const hasProgress = video.watchProgress > 0 && video.status !== 'COMPLETED';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-3 sm:p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold line-clamp-2 pr-8">
                {video.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <Badge className={config.bg} variant="secondary">
                  <StatusIcon className={`h-3 w-3 mr-1 ${config.color}`} />
                  {config.label}
                </Badge>
                {'playlist' in video && video.playlist && (
                  <Badge variant="outline">{video.playlist.category}</Badge>
                )}
                {hasProgress && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Resume at {secondsToTimestamp(video.watchProgress)}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-3 sm:p-4 space-y-4">
          {/* YouTube Player */}
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {useIframeAPI ? (
              <div id={playerContainerRef.current} className="w-full h-full" />
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1&start=${video.watchProgress || 0}&autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant={status === 'COMPLETED' ? 'default' : 'outline'}
              onClick={() => updateStatus('COMPLETED')}
              className={`${
                status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Completed</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => updateStatus('WATCHING')}
              disabled={status === 'WATCHING'}
              size="sm"
            >
              <PlayCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Watching</span>
            </Button>

            <Button variant="outline" onClick={markForPractice} size="sm">
              <Target className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Practice</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowNotes(!showNotes)}
              size="sm"
            >
              <BookOpen className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Notes</span>
            </Button>

            {/* REGENERATE AI TAKEAWAYS BUTTON - Only show if takeaways already exist */}
            {parsedTakeaways && (
              <Button
                variant="outline"
                onClick={() => generateDetailedTakeaways(true)} // Force regenerate = true
                disabled={loadingTakeaways}
                size="sm"
                className="col-span-2 sm:col-span-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900 dark:hover:to-blue-900"
              >
                {loadingTakeaways && isRegenerating ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 sm:mr-2 text-purple-500" />
                )}
                <span className="hidden sm:inline">
                  {loadingTakeaways && isRegenerating ? 'Regenerating...' : 'Regenerate AI Takeaways'}
                </span>
                <span className="sm:hidden">
                  {loadingTakeaways && isRegenerating ? 'Regenerating...' : 'Regen AI'}
                </span>
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() =>
                window.open(
                  `https://www.youtube.com/watch?v=${video.videoId}${
                    hasProgress ? `&t=${video.watchProgress}` : ''
                  }`,
                  '_blank'
                )
              }
              size="sm"
              className="col-span-2 sm:col-span-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              YouTube
            </Button>
          </div>

          {/* Notes Section */}
          {showNotes && (
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                Your Notes
              </h3>
              <Textarea
                placeholder="Write your notes, key learnings, questions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="bg-white dark:bg-gray-800 text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={saveNotes} disabled={saving} size="sm">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNotes(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* DETAILED AI Takeaways Section - Show when exists and NOT currently regenerating */}
          {parsedTakeaways && !(loadingTakeaways && isRegenerating) && (
            <div className="border rounded-lg overflow-hidden">
              {/* Header - Always Visible */}
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950"
                onClick={() => setShowTakeaways(!showTakeaways)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm sm:text-base">
                    Detailed AI Learning Summary
                  </h3>
                  {parsedTakeaways.difficulty && (
                    <Badge variant="outline" className="text-xs">
                      {parsedTakeaways.difficulty}
                    </Badge>
                  )}
                  {parsedTakeaways.estimatedPracticeTime && (
                    <Badge variant="outline" className="text-xs hidden sm:flex">
                      ⏱️ {parsedTakeaways.estimatedPracticeTime}
                    </Badge>
                  )}
                </div>
                {showTakeaways ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Summary Preview - Always Visible */}
              <div className="px-4 py-3 border-b bg-white dark:bg-gray-950">
                <p className="text-sm text-muted-foreground">
                  {parsedTakeaways.summary || 'Detailed AI analysis available. Click to expand.'}
                </p>
              </div>

              {/* Full Detailed Takeaways - Expandable */}
              {showTakeaways && (
                <div className="p-4 bg-white dark:bg-gray-950 max-h-[60vh] overflow-y-auto">
                  <DetailedTakeawayContent takeaways={parsedTakeaways} />
                </div>
              )}
            </div>
          )}

          {/* REGENERATING STATE - Show when regenerating existing takeaways */}
          {loadingTakeaways && isRegenerating && (
            <div className="border rounded-lg p-6 text-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border-purple-300 dark:border-purple-700">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-pulse" />
                  </div>
                  <RefreshCw className="h-12 w-12 text-purple-500 mx-auto animate-spin" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100">
                    Regenerating AI Takeaways...
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    AI is analyzing the video again to provide fresh insights, 
                    updated code examples, and new perspectives.
                  </p>
                </div>

                {/* Animated Progress Indicators */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <LoadingStep icon="🔄" label="Re-analyzing" delay={0} />
                  <LoadingStep icon="💡" label="Fresh insights" delay={1} />
                  <LoadingStep icon="✨" label="New examples" delay={2} />
                </div>

                {/* Loading Bar */}
                <div className="w-full max-w-xs mx-auto bg-purple-200 dark:bg-purple-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-loading-bar" />
                </div>

                <p className="text-xs text-muted-foreground">
                  This usually takes 10-15 seconds...
                </p>
              </div>
            </div>
          )}

          {/* GET AI-POWERED INSIGHTS BOX - Show when NO takeaways exist */}
          {!parsedTakeaways && !loadingTakeaways && (
            <div className="border border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-6 text-center bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/50 dark:to-blue-950/50">
              <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Get AI-Powered Insights</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                Generate comprehensive takeaways including key points, code examples, 
                comparison tables, practice ideas, and more.
              </p>
              <Button
                onClick={() => generateDetailedTakeaways(false)} // Not a regeneration
                disabled={loadingTakeaways}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Takeaways
              </Button>
            </div>
          )}

          {/* INITIAL GENERATION LOADING STATE - Show when generating for first time */}
          {loadingTakeaways && !isRegenerating && !parsedTakeaways && (
            <div className="border rounded-lg p-6 text-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border-purple-300 dark:border-purple-700">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-pulse" />
                  </div>
                  <Brain className="h-12 w-12 text-purple-500 mx-auto animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100">
                    AI is Analyzing Your Video...
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Generating comprehensive takeaways including key points, code examples, 
                    comparison tables, and practice ideas.
                  </p>
                </div>

                {/* Animated Progress Indicators */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <LoadingStep icon="📝" label="Extracting key points" delay={0} />
                  <LoadingStep icon="💻" label="Finding code examples" delay={1} />
                  <LoadingStep icon="📊" label="Building tables" delay={2} />
                </div>

                {/* Loading Bar */}
                <div className="w-full max-w-xs mx-auto bg-purple-200 dark:bg-purple-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-loading-bar" />
                </div>

                <p className="text-xs text-muted-foreground">
                  This usually takes 10-15 seconds...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Loading Step Component
// ============================================

function LoadingStep({ icon, label, delay }: { icon: string; label: string; delay: number }) {
  return (
    <div
      className="flex flex-col items-center gap-1 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay * 0.5}s`, animationFillMode: 'forwards' }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  );
}

// ============================================
// Detailed Takeaway Content Component
// ============================================

interface DetailedTakeawayContentProps {
  takeaways: EnhancedTakeaways;
}

function DetailedTakeawayContent({ takeaways }: DetailedTakeawayContentProps) {
  if (!takeaways) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No takeaways available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Points */}
      {takeaways.keyPoints && takeaways.keyPoints.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            Key Points
          </h4>
          <ul className="space-y-2">
            {takeaways.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-1 font-bold">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concepts Explained */}
      {takeaways.conceptsExplained && takeaways.conceptsExplained.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-300">
            <BookOpen className="h-4 w-4" />
            Concepts Explained
          </h4>
          <div className="space-y-3">
            {takeaways.conceptsExplained.map((concept, i) => (
              <div
                key={i}
                className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 border border-blue-100 dark:border-blue-900"
              >
                <h5 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">
                  {concept.concept}
                </h5>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {concept.explanation}
                </p>
                {concept.example && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic border-t border-blue-200 dark:border-blue-800 pt-2">
                    💡 Example: {concept.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables */}
      {takeaways.tables && takeaways.tables.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-300">
            <Table className="h-4 w-4" />
            Quick Reference Tables
          </h4>
          {takeaways.tables.map((table, i) => (
            <div key={i} className="mb-4">
              <h5 className="font-medium text-sm mb-2">{table.title}</h5>
              {table.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {table.description}
                </p>
              )}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-purple-50 dark:bg-purple-950">
                      {table.headers?.map((header, j) => (
                        <th
                          key={j}
                          className="border-b border-purple-200 dark:border-purple-800 px-3 py-2 text-left font-medium text-purple-900 dark:text-purple-100"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows?.map((row, j) => (
                      <tr
                        key={j}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        {row.map((cell, k) => (
                          <td
                            key={k}
                            className="border-b border-gray-200 dark:border-gray-700 px-3 py-2"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparisons */}
      {takeaways.comparisons && takeaways.comparisons.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            ⚖️ Comparisons
          </h4>
          {takeaways.comparisons.map((comparison, i) => (
            <div key={i} className="mb-4">
              <h5 className="font-medium text-sm mb-3">{comparison.title}</h5>
              <div className="grid gap-3 md:grid-cols-2">
                {comparison.items?.map((item, j) => (
                  <div
                    key={j}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border"
                  >
                    <h6 className="font-medium text-sm mb-3 pb-2 border-b">
                      {item.name}
                    </h6>
                    <div className="space-y-3">
                      {item.pros && item.pros.length > 0 && (
                        <div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">
                            ✓ Pros
                          </span>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {item.pros.map((pro, k) => (
                              <li key={k} className="flex items-start gap-1">
                                <span className="text-green-500">+</span> {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.cons && item.cons.length > 0 && (
                        <div>
                          <span className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">
                            ✗ Cons
                          </span>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {item.cons.map((con, k) => (
                              <li key={k} className="flex items-start gap-1">
                                <span className="text-red-500">-</span> {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.useCase && (
                        <p className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded">
                          <span className="font-semibold">Best for:</span>{' '}
                          {item.useCase}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Snippets */}
      {takeaways.codeSnippets && takeaways.codeSnippets.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-300">
            <Code className="h-4 w-4" />
            Code Examples
          </h4>
          {takeaways.codeSnippets.map((snippet, i) => (
            <CodeSnippetBlock key={i} snippet={snippet} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {takeaways.warnings && takeaways.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Common Pitfalls to Avoid
          </h4>
          <ul className="space-y-2">
            {takeaways.warnings.map((warning, i) => (
              <li
                key={i}
                className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {takeaways.tips && takeaways.tips.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-900">
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-800 dark:text-green-200">
            <Lightbulb className="h-4 w-4" />
            Pro Tips
          </h4>
          <ul className="space-y-2">
            {takeaways.tips.map((tip, i) => (
              <li
                key={i}
                className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2"
              >
                <span className="text-green-500 mt-0.5">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Ideas */}
      {takeaways.practiceIdeas && takeaways.practiceIdeas.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            🎯 Practice Ideas
          </h4>
          <div className="grid gap-2">
            {takeaways.practiceIdeas.map((idea, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-3 border border-blue-100 dark:border-blue-900"
              >
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {i + 1}
                </span>
                <span>{idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {takeaways.nextSteps && takeaways.nextSteps.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300">
            <ArrowRight className="h-4 w-4" />
            Next Steps
          </h4>
          <ul className="space-y-2">
            {takeaways.nextSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-indigo-500">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {takeaways.resources && takeaways.resources.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-cyan-700 dark:text-cyan-300">
            <ExternalLink className="h-4 w-4" />
            Recommended Resources
          </h4>
          <div className="flex flex-wrap gap-2">
            {takeaways.resources.map((resource, i) => (
              <Badge key={i} variant="outline" className="text-xs py-1.5 px-3">
                {resource.type === 'documentation' && '📚'}
                {resource.type === 'article' && '📄'}
                {resource.type === 'video' && '🎬'}
                {resource.type === 'github' && '💻'}
                {resource.type === 'other' && '🔗'} {resource.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {takeaways.prerequisites && takeaways.prerequisites.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-4 mt-6">
          <span className="font-semibold">Prerequisites: </span>
          {takeaways.prerequisites.join(' • ')}
        </div>
      )}
    </div>
  );
}

// ============================================
// Code Snippet Block Component
// ============================================

interface CodeSnippetProps {
  snippet: {
    language?: string;
    code: string;
    explanation?: string;
    title?: string;
  };
}

function CodeSnippetBlock({ snippet }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mb-4">
      {snippet.title && (
        <h5 className="font-medium text-sm mb-2">{snippet.title}</h5>
      )}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-800 text-gray-400 text-xs flex items-center justify-between">
          <span className="font-mono">{snippet.language || 'code'}</span>
          <button
            className="flex items-center gap-1.5 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-gray-100 text-sm overflow-x-auto scrollbar-thin">
          <code>{snippet.code}</code>
        </pre>
      </div>
      {snippet.explanation && (
        <p className="text-xs text-muted-foreground mt-2 px-1 italic">
          ℹ️ {snippet.explanation}
        </p>
      )}
    </div>
  );
}
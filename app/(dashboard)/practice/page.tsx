// app/(dashboard)/practice/page.tsx

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPracticeVideos, getCompletedVideos } from '@/lib/queries/videos';
import { PracticeList } from '@/components/practice/practice-list';
import { SuggestionsSection } from '@/components/practice/suggestions-section';
import { Suspense } from 'react';
import { VideoListSkeleton } from '@/components/shared/skeleton-loader';
import { Dumbbell } from 'lucide-react';

async function PracticeContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const [practiceVideos, completedVideos] = await Promise.all([
    getPracticeVideos(user.id),
    getCompletedVideos(user.id, 20),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
            <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Practice Mode</h1>
            <p className="text-muted-foreground text-xs sm:text-sm lg:text-base mt-0.5">
              Reinforce your learning with hands-on practice
            </p>
          </div>
        </div>

        {/* Stats - Horizontal on mobile */}
        <div className="flex gap-3 sm:gap-6 bg-muted/50 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-center flex-1 sm:flex-none">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {completedVideos.length}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="w-px bg-border sm:hidden" />
          <div className="text-center flex-1 sm:flex-none">
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {practiceVideos.length}
            </p>
            <p className="text-[10px] sm:text-sm text-muted-foreground">To Practice</p>
          </div>
        </div>
      </div>

      {/* AI Suggestions - Client Component */}
      <SuggestionsSection completedVideosCount={completedVideos.length} />

      {/* Practice Lists - Client Component for interactivity */}
      <PracticeList
        practiceVideos={practiceVideos}
        completedVideos={completedVideos}
      />
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-lg animate-pulse" />
              <div>
                <div className="h-6 sm:h-8 w-32 sm:w-48 bg-muted rounded animate-pulse" />
                <div className="h-3 sm:h-4 w-48 sm:w-64 bg-muted rounded animate-pulse mt-2" />
              </div>
            </div>
          </div>
          <div className="h-40 sm:h-48 bg-muted rounded-lg animate-pulse" />
          <VideoListSkeleton />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
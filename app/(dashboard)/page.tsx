// app/(dashboard)/page.tsx

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDashboardStats, getRecentActivity } from '@/lib/queries/dashboard';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ProgressOverview } from '@/components/dashboard/progress-overview';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { TodayTargetCard } from '@/components/dashboard/today-target';
import { Suspense } from 'react';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Loading component
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}

// Skeleton components for better loading UX
function StatsSkeletons() {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 sm:h-28 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ContentSkeletons() {
  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="space-y-4 lg:space-y-6">
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// Error component
function DashboardError({ userName }: { userName: string }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
          Welcome back, {userName}! 👋
        </h1>
      </div>

      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
          <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
          <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
            There was an error loading your dashboard data.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  try {
    const [stats, recentActivity] = await Promise.all([
      getDashboardStats(user.id),
      getRecentActivity(user.id),
    ]);

    // Safety check
    if (!stats) {
      console.error('Stats returned null/undefined');
      return <DashboardError userName={user.name.split(' ')[0]} />;
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <span className="hidden sm:inline">Welcome back,</span>
              <span className="sm:hidden">Hi,</span>
              {user.name.split(' ')[0]}! 
              <span className="text-2xl">👋</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-0.5 sm:mt-1">
              Track your learning progress and stay consistent
            </p>
          </div>
          
          {/* Mobile: Quick stat badge */}
          <div className="sm:hidden flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>{stats.streak} day streak</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Main Content Grid - Responsive */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Left Column - Takes 2/3 on large screens */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Today's Target */}
            <TodayTargetCard userId={user.id} />

            {/* Progress Overview */}
            <ProgressOverview stats={stats} />

            {/* Recent Activity - Hidden on mobile by default, shown at bottom */}
            <div className="hidden sm:block">
              <RecentActivity videos={recentActivity || []} />
            </div>
          </div>

          {/* Right Column - Takes 1/3 on large screens */}
          <div className="space-y-4 lg:space-y-6">
            {/* Quick Actions */}
            <QuickActions />
          </div>

          {/* Recent Activity - Mobile: Full width at bottom */}
          <div className="sm:hidden lg:col-span-3">
            <RecentActivity videos={recentActivity || []} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return <DashboardError userName={user.name.split(' ')[0]} />;
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="h-7 sm:h-9 w-48 sm:w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 sm:h-5 w-56 sm:w-80 bg-muted rounded animate-pulse mt-2" />
        </div>
        <StatsSkeletons />
        <ContentSkeletons />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
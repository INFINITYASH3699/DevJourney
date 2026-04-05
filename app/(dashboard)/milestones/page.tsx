import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMilestones } from '@/lib/queries/milestones';
import { MilestoneItem } from '@/components/milestones/milestone-item';
import { AddMilestoneDialog } from '@/components/milestones/add-milestone-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, Clock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Suspense } from 'react';
import { Milestone } from '@/types';

async function MilestonesContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const milestones = await getMilestones(user.id);

  const stats = {
    total: milestones.length,
    completed: milestones.filter((m: Milestone) => m.completed).length,
    active: milestones.filter((m: Milestone) => !m.completed).length,
  };

  const activeMilestones = milestones.filter((m: Milestone) => !m.completed);
  const completedMilestones = milestones.filter((m: Milestone) => m.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Milestones</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Track your learning goals and achievements
          </p>
        </div>
        <AddMilestoneDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Active
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Done
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <EmptyState type="milestones" />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {activeMilestones.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Active Goals
              </h2>
              <div className="space-y-3">
                {activeMilestones.map((milestone: Milestone) => (
                  <MilestoneItem key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}

          {completedMilestones.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Completed Goals
              </h2>
              <div className="space-y-3">
                {completedMilestones.map((milestone: Milestone) => (
                  <MilestoneItem key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MilestonesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
            </div>
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <MilestonesContent />
    </Suspense>
  );
}
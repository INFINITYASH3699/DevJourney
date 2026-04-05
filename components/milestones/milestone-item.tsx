'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Milestone } from '@/types';
import { MoreVertical, Calendar, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MilestoneItemProps {
  milestone: Milestone;
}

export function MilestoneItem({ milestone }: MilestoneItemProps) {
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const toggleComplete = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !milestone.completed }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success(
        milestone.completed ? 'Milestone reopened' : 'Milestone completed! 🎉'
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update milestone');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Milestone deleted');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete milestone');
    } finally {
      setUpdating(false);
    }
  };

  const isOverdue =
    milestone.targetDate &&
    !milestone.completed &&
    new Date(milestone.targetDate) < new Date();

  return (
    <Card className={milestone.completed ? 'opacity-60' : ''}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Checkbox
                checked={milestone.completed}
                onCheckedChange={toggleComplete}
                disabled={updating}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium text-sm sm:text-base ${
                    milestone.completed
                      ? 'line-through text-muted-foreground'
                      : ''
                  }`}
                >
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {milestone.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={updating}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {milestone.category}
              </Badge>

              {milestone.targetDate && (
                <Badge
                  variant={isOverdue ? 'destructive' : 'outline'}
                  className="gap-1 text-xs"
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(milestone.targetDate)}
                  {isOverdue && (
                    <span className="hidden sm:inline"> (Overdue)</span>
                  )}
                </Badge>
              )}

              {milestone.completed && milestone.completedAt && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-green-50 text-green-700 border-green-200 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    Completed {formatDate(milestone.completedAt)}
                  </span>
                  <span className="sm:hidden">Done</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
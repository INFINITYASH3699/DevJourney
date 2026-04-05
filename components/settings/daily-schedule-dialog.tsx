// components/settings/daily-schedule-dialog.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DailySchedule, DayOfWeek } from '@/types';
import { toast } from 'sonner';
import { Clock, Loader2, Save } from 'lucide-react';
import { DEFAULT_DAILY_SCHEDULE, minutesToReadable } from '@/lib/utils';

interface DailyScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule?: DailySchedule | null;
  onUpdate?: () => void;
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function DailyScheduleDialog({
  isOpen,
  onClose,
  currentSchedule,
  onUpdate,
}: DailyScheduleDialogProps) {
  const [schedule, setSchedule] = useState<DailySchedule>(
    currentSchedule || DEFAULT_DAILY_SCHEDULE
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSchedule) {
      setSchedule(currentSchedule);
    }
  }, [currentSchedule]);

  const handleChange = (day: DayOfWeek, minutes: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: Math.max(0, Math.min(1440, minutes)), // 0 to 24 hours
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailySchedule: schedule }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Schedule saved! Your daily targets will update accordingly.');
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const totalWeeklyHours = Object.values(schedule).reduce((sum, mins) => sum + mins, 0) / 60;

  const handleQuickSet = (minutes: number) => {
    const newSchedule = { ...schedule };
    DAYS.forEach(day => {
      newSchedule[day.key] = minutes;
    });
    setSchedule(newSchedule);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Learning Schedule
          </DialogTitle>
          <DialogDescription>
            Set how many hours you can dedicate to learning each day. 
            This helps calculate realistic daily targets for your playlists.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Set Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Quick set all:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickSet(30)}
            >
              30m
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickSet(60)}
            >
              1h
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickSet(120)}
            >
              2h
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickSet(180)}
            >
              3h
            </Button>
          </div>

          {/* Day-by-day Schedule */}
          <div className="space-y-3">
            {DAYS.map(day => (
              <div key={day.key} className="flex items-center gap-3">
                <Label className="w-24 text-sm font-medium">{day.label}</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    step="15"
                    value={schedule[day.key]}
                    onChange={(e) => handleChange(day.key, parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({minutesToReadable(schedule[day.key])})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Total */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Weekly Total</span>
            <span className="text-lg font-bold text-primary">
              {totalWeeklyHours.toFixed(1)} hours
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
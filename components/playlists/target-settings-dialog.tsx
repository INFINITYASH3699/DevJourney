// components/playlists/target-settings-dialog.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Playlist } from '@/types';
import { toast } from 'sonner';
import { 
  Calendar, 
  Target, 
  Clock, 
  Loader2,
  Trash2,
  Calculator,
} from 'lucide-react';
import { 
  formatDate, 
  getDaysUntil, 
  secondsToReadable,
  minutesToReadable,
} from '@/lib/utils';

interface TargetSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onUpdate: () => void;
}

export function TargetSettingsDialog({
  isOpen,
  onClose,
  playlist,
  onUpdate,
}: TargetSettingsDialogProps) {
  const [targetDate, setTargetDate] = useState<string>('');
  const [dailyTarget, setDailyTarget] = useState<number | ''>('');
  const [targetVideos, setTargetVideos] = useState<number | ''>('');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Initialize values
  useEffect(() => {
    if (playlist.targetDate) {
      setTargetDate(new Date(playlist.targetDate).toISOString().split('T')[0]);
    } else {
      setTargetDate('');
    }
    setDailyTarget(playlist.dailyTarget || '');
    setTargetVideos(playlist.targetVideos || '');
  }, [playlist]);

  // Calculate estimates
  const remainingVideos = playlist.totalVideos - playlist.completedVideos;
  const remainingMinutes = Math.ceil((playlist.totalDuration || 0) / 60) * 
    (remainingVideos / Math.max(1, playlist.totalVideos));
  
  const daysUntilTarget = targetDate ? getDaysUntil(targetDate) : 0;
  
  const calculatedDailyMinutes = daysUntilTarget > 0 
    ? Math.ceil(remainingMinutes / daysUntilTarget)
    : remainingMinutes;
  
  const calculatedDailyVideos = daysUntilTarget > 0
    ? Math.ceil(remainingVideos / daysUntilTarget)
    : remainingVideos;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDate: targetDate || null,
          dailyTarget: autoCalculate ? undefined : (dailyTarget || null),
          targetVideos: autoCalculate ? undefined : (targetVideos || null),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Target settings saved');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save target settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearTarget = async () => {
    setClearing(true);
    try {
      const response = await fetch(`/api/playlists/${playlist.id}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearTarget: true }),
      });

      if (!response.ok) throw new Error('Failed to clear');

      toast.success('Target cleared');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear target');
    } finally {
      setClearing(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Learning Target
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Playlist Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm">{playlist.title}</h4>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                {remainingVideos} videos left
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                ~{minutesToReadable(Math.round(remainingMinutes))} remaining
              </Badge>
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Complete By
            </Label>
            <Input
              id="targetDate"
              type="date"
              min={today}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            {targetDate && daysUntilTarget > 0 && (
              <p className="text-xs text-muted-foreground">
                {daysUntilTarget} days from now
              </p>
            )}
            {targetDate && daysUntilTarget <= 0 && (
              <p className="text-xs text-red-500">
                ⚠️ This date is in the past or today
              </p>
            )}
          </div>

          {/* Auto-calculated targets */}
          {targetDate && daysUntilTarget > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                <Calculator className="h-4 w-4" />
                Suggested Daily Target
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium">
                    ~{minutesToReadable(calculatedDailyMinutes)}/day
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Videos:</span>
                  <p className="font-medium">
                    ~{calculatedDailyVideos} videos/day
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Override */}
          {!autoCalculate && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="dailyTarget">Daily Time Target (minutes)</Label>
                <Input
                  id="dailyTarget"
                  type="number"
                  min="0"
                  placeholder="e.g., 60"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value ? parseInt(e.target.value) : '')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetVideos">Daily Video Target</Label>
                <Input
                  id="targetVideos"
                  type="number"
                  min="0"
                  placeholder="e.g., 3"
                  value={targetVideos}
                  onChange={(e) => setTargetVideos(e.target.value ? parseInt(e.target.value) : '')}
                />
              </div>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="autoCalc" className="text-sm cursor-pointer">
              Auto-calculate daily targets
            </Label>
            <input
              id="autoCalc"
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {playlist.targetDate && (
            <Button
              variant="outline"
              onClick={handleClearTarget}
              disabled={clearing}
              className="w-full sm:w-auto text-red-600 hover:text-red-700"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Target
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Target
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
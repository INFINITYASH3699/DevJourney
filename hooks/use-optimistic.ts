// hooks/use-optimistic.ts

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VideoStatus, VideoUpdateData, Video, Milestone } from '@/types';

interface UpdateVideoParams {
  videoId: string;
  updates: VideoUpdateData;
}

export function useOptimisticVideoUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ videoId, updates }: UpdateVideoParams) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update video');
      }

      return response.json();
    },

    onMutate: async ({ videoId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['videos'] });
      await queryClient.cancelQueries({ queryKey: ['video', videoId] });

      // Snapshot previous value
      const previousVideo = queryClient.getQueryData(['video', videoId]);

      // Optimistically update
      queryClient.setQueryData(['video', videoId], (old: Video | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousVideo };
    },

    onError: (err, { videoId }, context) => {
      // Rollback on error
      if (context?.previousVideo) {
        queryClient.setQueryData(['video', videoId], context.previousVideo);
      }
      toast.error(err.message || 'Failed to update video');
    },

    onSuccess: (data, { updates }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });

      if (updates.status) {
        const statusMessage =
          updates.status === 'COMPLETED'
            ? 'Video marked as completed! 🎉'
            : updates.status === 'WATCHING'
            ? 'Video marked as watching'
            : 'Video status updated';
        toast.success(statusMessage);
      } else if (updates.needsPractice !== undefined) {
        toast.success(
          updates.needsPractice
            ? 'Added to practice list'
            : 'Removed from practice list'
        );
      } else if (updates.notes !== undefined) {
        toast.success('Notes saved');
      }
    },
  });
}

interface MilestoneWithId {
  id: string;
  [key: string]: unknown;
}

export function useOptimisticMilestoneUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      updates,
    }: {
      milestoneId: string;
      updates: { completed?: boolean };
    }) => {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      return response.json();
    },

    onMutate: async ({ milestoneId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['milestones'] });

      const previousMilestones = queryClient.getQueryData(['milestones']);

      queryClient.setQueryData(['milestones'], (old: MilestoneWithId[] | undefined) => {
        if (!old) return old;
        return old.map((m) =>
          m.id === milestoneId ? { ...m, ...updates } : m
        );
      });

      return { previousMilestones };
    },

    onError: (err, variables, context) => {
      if (context?.previousMilestones) {
        queryClient.setQueryData(['milestones'], context.previousMilestones);
      }
      toast.error('Failed to update milestone');
    },

    onSuccess: (data, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (updates.completed) {
        toast.success('Milestone completed! 🎉');
      }
    },
  });
}
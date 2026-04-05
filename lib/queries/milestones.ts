import { prisma } from '@/lib/prisma';
import { Milestone } from '@/types';

export async function getMilestones(userId: string): Promise<Milestone[]> {
  return prisma.milestone.findMany({
    where: { userId },
    orderBy: [{ completed: 'asc' }, { targetDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createMilestone(
  userId: string,
  data: {
    title: string;
    description?: string;
    category: string;
    targetDate?: string;
  }
): Promise<Milestone> {
  return prisma.milestone.create({
    data: {
      userId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  });
}

export async function updateMilestone(
  milestoneId: string,
  userId: string,
  data: {
    completed?: boolean;
    title?: string;
    description?: string;
    targetDate?: string;
  }
): Promise<Milestone | null> {
  // Verify ownership
  const existing = await prisma.milestone.findFirst({
    where: { id: milestoneId, userId },
  });

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};

  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    updateData.completedAt = data.completed ? new Date() : null;
  }

  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.targetDate !== undefined) {
    updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
  }

  return prisma.milestone.update({
    where: { id: milestoneId },
    data: updateData,
  });
}

export async function deleteMilestone(
  milestoneId: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.milestone.deleteMany({
    where: { id: milestoneId, userId },
  });

  return result.count > 0;
}
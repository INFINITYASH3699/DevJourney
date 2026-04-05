import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Mail,
  Flame,
  TrendingUp,
  ListVideo,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      playlists: {
        include: {
          videos: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
      milestones: {
        select: {
          id: true,
          completed: true,
        },
      },
    },
  });

  if (!user) return null;

  const totalVideos = user.playlists.reduce(
    (acc, p) => acc + p.videos.length,
    0
  );

  const completedVideos = user.playlists.reduce(
    (acc, p) =>
      acc + p.videos.filter((v) => v.status === 'COMPLETED').length,
    0
  );

  const activeMilestones = user.milestones.filter((m) => !m.completed).length;
  const completedMilestones = user.milestones.filter((m) => m.completed).length;

  return {
    user,
    stats: {
      totalPlaylists: user.playlists.length,
      totalVideos,
      completedVideos,
      activeMilestones,
      completedMilestones,
      streak: user.streak,
    },
  };
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  const data = await getUserStats(user.id);

  if (!data) {
    redirect('/signin');
  }

  const { user: userData, stats } = data;

  const statItems = [
    {
      label: 'Playlists',
      value: stats.totalPlaylists,
      icon: ListVideo,
      color: 'text-blue-500',
    },
    {
      label: 'Videos Done',
      value: `${stats.completedVideos}/${stats.totalVideos}`,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Active Goals',
      value: stats.activeMilestones,
      icon: Target,
      color: 'text-orange-500',
    },
    {
      label: 'Goals Done',
      value: stats.completedMilestones,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary text-primary-foreground">
                {userData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold">{userData.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{userData.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Joined {formatDate(userData.createdAt)}
                </span>
              </div>
            </div>

            {/* Streak */}
            <div className="flex flex-col items-center gap-1 bg-orange-50 rounded-lg p-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold">{stats.streak}</span>
              <span className="text-xs text-muted-foreground">Day Streak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  {item.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">
                  {item.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <span className="text-sm font-medium">Account Type</span>
            <Badge>Email/Password</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <span className="text-sm font-medium">Last Active</span>
            <span className="text-sm text-muted-foreground">
              {formatDate(userData.lastActive)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {stats.completedVideos} of {stats.totalVideos} videos completed
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
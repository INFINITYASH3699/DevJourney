// components/dashboard/quick-actions.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Play, Target, Dumbbell, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AddPlaylistDialog } from '@/components/playlists/add-playlist-dialog';

export function QuickActions() {
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'Add Playlist',
      shortLabel: 'Add',
      onClick: () => setShowAddPlaylist(true),
      variant: 'default' as const,
      className: 'bg-primary hover:bg-primary/90',
    },
    {
      icon: Play,
      label: 'Continue Watching',
      shortLabel: 'Continue',
      href: '/playlists',
      variant: 'outline' as const,
    },
    {
      icon: Dumbbell,
      label: 'Practice Mode',
      shortLabel: 'Practice',
      href: '/practice',
      variant: 'outline' as const,
    },
    {
      icon: Target,
      label: 'Set Milestone',
      shortLabel: 'Milestone',
      href: '/milestones',
      variant: 'outline' as const,
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* Mobile: 2x2 grid, Desktop: vertical list */}
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
            {actions.map((action) => {
              const Icon = action.icon;

              if (action.href) {
                return (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant={action.variant}
                      className="w-full justify-start h-10 sm:h-11 text-xs sm:text-sm"
                    >
                      <Icon className="h-4 w-4 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="sm:hidden">{action.shortLabel}</span>
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  </Link>
                );
              }

              return (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className={`w-full justify-start h-10 sm:h-11 text-xs sm:text-sm ${action.className || ''}`}
                  onClick={action.onClick}
                >
                  <Icon className="h-4 w-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="sm:hidden">{action.shortLabel}</span>
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddPlaylistDialog
        open={showAddPlaylist}
        onOpenChange={setShowAddPlaylist}
      />
    </>
  );
}
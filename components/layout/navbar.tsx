// components/layout/navbar.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  ListVideo,
  Target,
  Trophy,
  User,
  LogOut,
  Loader2,
  Clock,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { DailyScheduleDialog } from '@/components/settings/daily-schedule-dialog';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/playlists', label: 'Playlists', icon: ListVideo },
  { href: '/practice', label: 'Practice', icon: Target },
  { href: '/milestones', label: 'Milestones', icon: Trophy },
];

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Logout failed');

      toast.success('Logged out successfully');
      router.push('/signin');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 mr-6">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">D</span>
            </div>
            <span className="font-bold hidden sm:inline-block">DevJourney</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {userName && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Keep learning! 🚀
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={() => setShowScheduleDialog(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Daily Schedule
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-red-600 focus:text-red-600"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Schedule Dialog */}
      <DailyScheduleDialog
        isOpen={showScheduleDialog}
        onClose={() => setShowScheduleDialog(false)}
        onUpdate={() => router.refresh()}
      />
    </>
  );
}
// components/layout/mobile-nav.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ListVideo,
  Target,
  Dumbbell,
  Sparkles,
  LogOut,
  User,
  Menu,
  X,
  Clock,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';
import { SessionUser } from '@/types';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/playlists', label: 'Playlists', icon: ListVideo },
  { href: '/practice', label: 'Practice', icon: Dumbbell },
  { href: '/milestones', label: 'Milestones', icon: Target },
];

interface MobileNavProps {
  user: SessionUser;
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Signout failed');
      }

      toast.success('Signed out successfully');
      window.location.href = '/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <>
      {/* Fixed Top Header Bar */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-shadow duration-200",
          isScrolled ? "shadow-md border-b" : "border-b"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">DevJourney</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="relative"
            >
              <span className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-200",
                isOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
              )}>
                <Menu className="h-5 w-5" />
              </span>
              <span className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-200",
                isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
              )}>
                <X className="h-5 w-5" />
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Menu Panel */}
      <div 
        className={cn(
          "fixed top-14 right-0 bottom-0 z-50 w-72 bg-background border-l shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            <div className="my-4 border-t" />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Account
            </p>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                pathname === '/profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Clock className="h-5 w-5" />
              Daily Schedule
            </Link>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t bg-muted/30">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-around h-16 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-primary'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
                )}
                <Icon className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
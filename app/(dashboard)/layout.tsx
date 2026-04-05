// app/(dashboard)/layout.tsx

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navbar userName={user.name} />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav user={user} />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Mobile: Add padding for fixed top header (h-14) and bottom nav (h-16 + safe area) */}
        <div className="md:pt-0 pt-14 pb-20 md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
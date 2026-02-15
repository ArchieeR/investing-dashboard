'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LayoutDashboard, Search, Compass, BarChart3, Menu, Settings, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/research', label: 'Research', icon: Search },
  { href: '/explorer', label: 'Explorer', icon: Compass },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function NavLinks({ className, onClick }: { className?: string; onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-2 rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardNav() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk, system-ui)' }}>
          <span className="text-[#FF6B00]">inv</span>
          <span className="text-foreground">ormed</span>
        </Link>

        {/* Desktop nav */}
        <NavLinks className="hidden md:flex" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar size="sm">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push('/settings')}>
                <Settings className="size-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="size-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <NavLinks className="flex-col items-start gap-2 mt-4" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

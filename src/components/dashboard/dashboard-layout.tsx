'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Settings, BarChart3, Activity, TrendingUp, Database, Shield, Zap, Target, Dice1, Bitcoin } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3, description: 'Financial Overview' },
    { href: '/trading', label: 'Stocks', icon: TrendingUp, description: 'Stock Trading' },
    { href: '/crypto', label: 'Crypto', icon: Bitcoin, description: 'Cryptocurrency' },
    { href: '/lottery', label: 'Lottery', icon: Target, description: 'Number Analytics' },
    { href: '/gambling', label: 'Gambling', icon: Dice1, description: 'Sports & Casino' },
    { href: '/portfolio', label: 'Portfolio', icon: Database, description: 'Asset Management' },
    { href: '/agents', label: 'Agents', icon: Zap, description: 'AI Management' },
    { href: '/security', label: 'Security', icon: Shield, description: 'Risk & Compliance' },
    { href: '/settings', label: 'Settings', icon: Settings, description: 'System Configuration' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="mr-6 flex">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg">Stratford AI</div>
                <div className="text-xs text-muted-foreground">Multi-Domain Wealth Engine</div>
              </div>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href as any}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2 h-9 px-3 group relative"
                      title={item.description}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline text-sm">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Status & Version */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-500 animate-pulse" />
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-green-600">LIVE</div>
                <div className="text-xs text-muted-foreground">v1.0.0</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn('container mx-auto px-4 py-6 max-w-screen-2xl', className)}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-screen-2xl">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with deterministic build methodology. Powered by{' '}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Next.js
              </a>
              {', '}
              <a
                href="https://tailwindcss.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Tailwind CSS
              </a>
              {', and '}
              <a
                href="https://recharts.org"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Recharts
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, BarChart3, Activity, TrendingUp, Database, Shield, Zap, Target, Dice1, Bitcoin } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3, description: 'Financial Overview' },
  { href: '/trading/', label: 'Stocks', icon: TrendingUp, description: 'Stock Trading' },
  { href: '/crypto/', label: 'Crypto', icon: Bitcoin, description: 'Cryptocurrency' },
  { href: '/lottery/', label: 'Lottery', icon: Target, description: 'Number Analytics' },
  { href: '/gambling/', label: 'Gambling', icon: Dice1, description: 'Sports & Casino' },
  { href: '/portfolio/', label: 'Portfolio', icon: Database, description: 'Asset Management' },
  { href: '/agents/', label: 'Agents', icon: Zap, description: 'AI Management' },
  { href: '/security/', label: 'Security', icon: Shield, description: 'Risk & Compliance' },
  { href: '/settings/', label: 'Settings', icon: Settings, description: 'System Configuration' },
];

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const pathname = usePathname();

  // Memoize current page to prevent re-renders
  const currentPage = useMemo(() => {
    const normalizedPathname = pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : pathname + '/';
    return navItems.find(item => {
      const normalizedHref = item.href.endsWith('/') ? item.href : item.href + '/';
      return normalizedPathname === normalizedHref || (item.href === '/' && pathname === '/');
    }) || navItems[0];
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar Navigation */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r shadow-sm flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-gradient-blue flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg bg-gradient-blue bg-clip-text text-transparent">Stratford AI</div>
                <div className="text-xs text-muted-foreground">Wealth Engine</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Normalize both paths for comparison (handle trailing slashes)
              const normalizedPathname = pathname.endsWith('/') ? pathname : pathname + '/';
              const normalizedHref = item.href.endsWith('/') ? item.href : item.href + '/';
              const isActive = normalizedPathname === normalizedHref ||
                               (item.href === '/' && pathname === '/');
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all cursor-pointer",
                      isActive
                        ? "bg-gradient-blue text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className={cn(
                        "text-xs",
                        isActive ? "text-white/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 bg-green-50 px-4 py-3 rounded-lg">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-green-700">LIVE</div>
              <div className="text-xs text-muted-foreground">v1.0.0</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b shadow-sm flex items-center px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              {currentPage.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentPage.description}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('px-6 py-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

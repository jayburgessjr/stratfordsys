'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Settings, BarChart3, TrendingUp, Database, Shield, Lightbulb, Zap, Menu, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/quantum/', label: 'Quantum', icon: Zap },
  { href: '/strategy/', label: 'Strategy', icon: Lightbulb },
  { href: '/trading/', label: 'Markets', icon: TrendingUp },
  { href: '/news/', label: 'News', icon: Globe },
  { href: '/portfolio/', label: 'Performance', icon: Database },
  { href: '/security/', label: 'Security', icon: Shield },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-transparent font-sans">
      {/* Cosmic Glass Sidebar */}
      <aside className="fixed left-4 top-4 bottom-4 z-40 w-64 rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden hidden md:flex transition-all duration-300 group hover:bg-card/70 hover:shadow-primary/5">

        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
        <div className="absolute -left-10 top-0 w-20 h-20 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

        {/* Logo Area */}
        <div className="p-6 mb-2 relative">
          <Link href="/">
            <div className="flex items-center gap-3 group/logo">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 group-hover/logo:scale-105 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-foreground group-hover/logo:text-primary transition-colors">Stratford</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Wealth Engine</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href as any} className="block group/item">
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent",
                    isActive
                      ? "bg-primary/10 text-foreground border-primary/20 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.5)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 hover:border-white/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover/item:scale-110",
                      isActive ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.8)]" : "text-muted-foreground group-hover/item:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* System Status / Footer */}
        <div className="p-4 mt-auto space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/5 to-transparent p-4 border border-border relative overflow-hidden group/status">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover/status:opacity-100 transition-opacity">
              <div className="w-16 h-16 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8" />
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-primary animate-ping opacity-50" />
              </div>
              <span className="text-xs font-medium text-primary">System Operational</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-muted-foreground">v2.4.0-quantum</span>
              <span className="text-[10px] text-muted-foreground">Lat: 12ms</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full z-50 p-4">
        <div className="bg-background/80 backdrop-blur-xl border border-border rounded-xl p-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Stratford</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] p-4 flex flex-col h-screen overflow-hidden">
        {/* Floating Ticker */}
        <div className="h-10 mb-4 rounded-xl bg-card/60 backdrop-blur-md border border-border flex items-center overflow-hidden relative shadow-lg flex-shrink-0">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="animate-ticker flex items-center space-x-12 px-4 whitespace-nowrap text-xs font-medium font-mono">
            {[
              { s: 'SPY', p: '412.35', c: 0.45, up: true },
              { s: 'QQQ', p: '348.12', c: 0.82, up: true },
              { s: 'BTC', p: '64,230', c: 2.1, up: true },
              { s: 'ETH', p: '3,450', c: 1.8, up: true },
              { s: 'VIX', p: '14.12', c: 3.2, up: false },
              { s: 'AAPL', p: '173.50', c: 0.3, up: true },
              { s: 'TSLA', p: '240.20', c: 1.1, up: false },
              { s: 'US10Y', p: '4.12', c: 0.05, up: true },
              { s: 'NVDA', p: '875.30', c: 4.2, up: true },
              { s: 'SOL', p: '145.20', c: 5.5, up: true },
            ].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground font-bold">{t.s}</span>
                <span className="text-foreground">{t.p}</span>
                <span className={cn(t.up ? "text-primary" : "text-destructive", "flex items-center gap-1")}>
                  {t.up ? '▲' : '▼'} {t.c}%
                </span>
              </span>
            ))}
          </div>
        </div>

        <main className={cn('flex-1 w-full max-w-7xl mx-auto flex flex-col min-h-0 overflow-hidden', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

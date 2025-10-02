'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Database, Activity, Target, Shield } from 'lucide-react';
import { GradientStatCard } from './gradient-stat-card';

export function PortfolioQuickStats() {
  return (
    <>
      <GradientStatCard
        title="Total Portfolio"
        value="$124,567"
        subtitle="Overall wealth across all platforms"
        icon={Database}
        gradient="blue"
        trend={{ value: "+12.45%", isPositive: true }}
      />

      <GradientStatCard
        title="Active Positions"
        value="23"
        subtitle="Currently open trades"
        icon={Activity}
        gradient="green"
        trend={{ value: "+5 today", isPositive: true }}
      />

      <GradientStatCard
        title="AI Confidence"
        value="87%"
        subtitle="Model prediction accuracy"
        icon={Target}
        gradient="purple"
        trend={{ value: "+3.2%", isPositive: true }}
      />

      <GradientStatCard
        title="Today's Trades"
        value="12"
        subtitle="8 wins, 4 losses"
        icon={TrendingUp}
        gradient="orange"
        trend={{ value: "66% win rate", isPositive: true }}
      />
    </>
  );
}

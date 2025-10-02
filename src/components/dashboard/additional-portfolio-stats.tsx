'use client';

import { Shield, Activity, Zap, TrendingUp } from 'lucide-react';
import { GradientStatCard } from './gradient-stat-card';

export function AdditionalPortfolioStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <GradientStatCard
        title="Max Drawdown"
        value="8.7%"
        subtitle="Largest peak-to-trough decline"
        icon={Shield}
        gradient="teal"
        trend={{ value: "23 days", isPositive: true }}
      />

      <GradientStatCard
        title="Active Strategies"
        value="12"
        subtitle="AI agents running 24/7"
        icon={Activity}
        gradient="red"
        trend={{ value: "+3 new", isPositive: true }}
      />

      <GradientStatCard
        title="Risk Level"
        value="Medium"
        subtitle="Portfolio risk assessment"
        icon={Shield}
        gradient="orange"
        trend={{ value: "Balanced", isPositive: true }}
      />

      <GradientStatCard
        title="Daily P&L"
        value="+$2,341"
        subtitle="Today's profit & loss"
        icon={TrendingUp}
        gradient="green"
        trend={{ value: "+12.5%", isPositive: true }}
      />
    </div>
  );
}

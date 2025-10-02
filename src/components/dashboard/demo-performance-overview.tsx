'use client';

import { DollarSign, Target, BarChart3, Shield, TrendingUp, Activity } from 'lucide-react';
import { GradientStatCard } from './gradient-stat-card';

export function DemoPerformanceOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <GradientStatCard
        title="Total Portfolio Value"
        value="$124,567"
        subtitle="Overall wealth across all platforms"
        icon={DollarSign}
        gradient="blue"
        trend={{ value: "12.45%", isPositive: true }}
      />

      <GradientStatCard
        title="Monthly Returns"
        value="+18.2%"
        subtitle="Average monthly performance"
        icon={TrendingUp}
        gradient="green"
        trend={{ value: "$8,450", isPositive: true }}
      />

      <GradientStatCard
        title="Win Rate"
        value="64.2%"
        subtitle="34 wins out of 53 trades"
        icon={BarChart3}
        gradient="purple"
        trend={{ value: "+5.2%", isPositive: true }}
      />

      <GradientStatCard
        title="Sharpe Ratio"
        value="1.42"
        subtitle="Risk-adjusted returns"
        icon={Target}
        gradient="orange"
        trend={{ value: "1.65 Sortino", isPositive: true }}
      />

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
    </div>
  );
}
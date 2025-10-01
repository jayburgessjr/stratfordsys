'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AgentDashboard } from '@/components/agents/agent-dashboard';
import { AITradingAgent } from '@/components/ai/ai-trading-agent';
import { AIStrategyGenerator } from '@/components/ai/ai-strategy-generator';

export default function AgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-muted-foreground">
              Manage and monitor your AI trading agents powered by GPT-4
            </p>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI-Powered Trading Agent */}
          <AITradingAgent />

          {/* AI Strategy Generator */}
          <AIStrategyGenerator />
        </div>

        {/* Existing Agent Dashboard */}
        <AgentDashboard />
      </div>
    </DashboardLayout>
  );
}
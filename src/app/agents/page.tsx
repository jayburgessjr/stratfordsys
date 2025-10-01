'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AgentDashboard } from '@/components/agents/agent-dashboard';

export default function AgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-muted-foreground">
              Manage and monitor your AI trading agents
            </p>
          </div>
        </div>

        <AgentDashboard />
      </div>
    </DashboardLayout>
  );
}
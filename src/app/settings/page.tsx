'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Activity,
  Bot,
  Database,
  Shield,
  Zap,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Lock,
  Globe
} from 'lucide-react';
import { AgentDashboard } from '@/components/agents/agent-dashboard';

interface SystemStatus {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
  lastUpdate: string;
}

interface AgentStatus {
  id: string;
  name: string;
  type: 'trading' | 'analysis' | 'risk' | 'monitoring';
  status: 'active' | 'idle' | 'stopped' | 'error';
  lastAction: string;
  performance: number;
  tasksCompleted: number;
}

export default function SettingsPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    uptime: 3600,
    memoryUsage: 128,
    activeConnections: 5,
    lastUpdate: new Date().toISOString()
  });

  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      id: 'trading-001',
      name: 'Primary Trading Agent',
      type: 'trading',
      status: 'active',
      lastAction: 'Executed MA Crossover Signal',
      performance: 94,
      tasksCompleted: 127
    },
    {
      id: 'analysis-001',
      name: 'Market Analysis Agent',
      type: 'analysis',
      status: 'active',
      lastAction: 'Generated Risk Report',
      performance: 89,
      tasksCompleted: 89
    },
    {
      id: 'risk-001',
      name: 'Risk Management Agent',
      type: 'risk',
      status: 'idle',
      lastAction: 'Portfolio Rebalancing Check',
      performance: 97,
      tasksCompleted: 45
    },
    {
      id: 'monitor-001',
      name: 'System Monitor Agent',
      type: 'monitoring',
      status: 'active',
      lastAction: 'Health Check Completed',
      performance: 99,
      tasksCompleted: 234
    }
  ]);

  const [settings, setSettings] = useState({
    autoTrading: true,
    riskManagement: true,
    realTimeAnalysis: true,
    alertsEnabled: true,
    maxPositionSize: 0.25,
    stopLossThreshold: 0.05,
    refreshRate: 5000,
    logLevel: 'info'
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        memoryUsage: Math.max(100, Math.min(300, prev.memoryUsage + (Math.random() - 0.5) * 10)),
        lastUpdate: new Date().toISOString()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
      case 'idle':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'error':
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Activity className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning':
      case 'idle':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'error':
      case 'stopped':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header */}
        <div className="flex flex-none justify-between items-center px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              System Control Center
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage global configurations and agent parameters
            </p>
          </div>
          <Badge variant="outline" className={`px-3 py-1 bg-black/40 backdrop-blur-md border-white/10 gap-2`}>
            {getStatusIcon(systemStatus.status)}
            <span className="capitalize text-zinc-300">{systemStatus.status}</span>
          </Badge>
        </div>

        {/* Main Content Area */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-none w-full justify-start bg-black/40 border border-white/5 p-1 mb-4 backdrop-blur-xl">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Activity className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              <Bot className="h-4 w-4" /> Agents
            </TabsTrigger>
            <TabsTrigger value="trading" className="gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <TrendingUp className="h-4 w-4" /> Trading
            </TabsTrigger>
            <TabsTrigger value="apis" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Database className="h-4 w-4" /> Connections
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">System Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatUptime(systemStatus.uptime)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Since last reboot</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Memory Usage</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{Math.round(systemStatus.memoryUsage)} MB</div>
                    <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full transition-all duration-500" style={{ width: `${(systemStatus.memoryUsage / 512) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Active Agents</CardTitle>
                    <Users className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{agents.filter(a => a.status === 'active').length} <span className="text-sm font-normal text-muted-foreground">/ {agents.length}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">Operational capacity</p>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">System Health</CardTitle>
                    <Activity className="h-4 w-4 text-emerald-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">100%</div>
                    <p className="text-xs text-muted-foreground mt-1">All systems nominal</p>
                  </CardContent>
                </Card>
              </div>

              {/* System Actions */}
              <Card className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                    <RefreshCw className="h-4 w-4 mr-2" /> Restart Services
                  </Button>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                    <Database className="h-4 w-4 mr-2" /> Clear Cache
                  </Button>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                    <Shield className="h-4 w-4 mr-2" /> Rotate Keys
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-0">
              <AgentDashboard />
            </TabsContent>

            {/* Trading Tab */}
            <TabsContent value="trading" className="mt-0 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" /> Execution Parameters
                  </CardTitle>
                  <CardDescription>Configure automated trading behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Execution</Label>
                      <p className="text-xs text-muted-foreground">Allow agents to place orders without confirmation</p>
                    </div>
                    <Switch checked={settings.autoTrading} onCheckedChange={v => setSettings(s => ({ ...s, autoTrading: v }))} />
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Max Position Size</Label>
                      <span className="text-sm text-primary font-mono">{(settings.maxPositionSize * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[settings.maxPositionSize]}
                      min={0.01} max={1} step={0.01}
                      onValueChange={([v]) => setSettings(s => ({ ...s, maxPositionSize: v }))}
                      className="py-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" /> Risk Management
                  </CardTitle>
                  <CardDescription>Global safety limits and stop-losses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Global Risk Guard</Label>
                      <p className="text-xs text-muted-foreground">Override all agents if drawdown exceeds limit</p>
                    </div>
                    <Switch checked={settings.riskManagement} onCheckedChange={v => setSettings(s => ({ ...s, riskManagement: v }))} />
                  </div>
                  <Separator className="bg-white/5" />
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Hard Stop Loss</Label>
                      <span className="text-sm text-rose-400 font-mono">{(settings.stopLossThreshold * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[settings.stopLossThreshold]}
                      min={0.01} max={0.2} step={0.005}
                      onValueChange={([v]) => setSettings(s => ({ ...s, stopLossThreshold: v }))}
                      className="py-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* APIs Tab */}
            <TabsContent value="apis" className="mt-0 space-y-4">
              <Card className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-400" /> Connected Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {[
                    { name: 'Alpaca Markets', type: 'Brokerage', status: 'Active', latency: '24ms' },
                    { name: 'Polygon.io', type: 'Data Feed', status: 'Active', latency: '12ms' },
                    { name: 'OpenAI API', type: 'Intelligence', status: 'Active', latency: '150ms' },
                    { name: 'Bloomberg Terminal', type: 'News', status: 'Inactive', latency: '-' }
                  ].map((api, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${api.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-600'}`} />
                        <div>
                          <p className="font-medium text-sm text-white">{api.name}</p>
                          <p className="text-xs text-muted-foreground">{api.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-black/40 border-white/10">{api.status}</Badge>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">{api.latency}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0 space-y-4">
              <Card className="bg-black/40 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-rose-400" /> Security Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
                    <h3 className="font-medium text-emerald-400 mb-1 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Environment Secured</h3>
                    <p className="text-xs text-zinc-400">All API keys are encrypted at rest. Rate limiting is active on all endpoints.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Two-Factor Authentication</Label>
                      <Switch checked={true} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>IP Whitelisting</Label>
                      <Switch checked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Audit Logging</Label>
                      <Switch checked={true} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Activity,
  Bot,
  Database,
  Shield,
  Zap,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'idle':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAgentAction = (agentId: string, action: 'start' | 'stop' | 'restart') => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        let newStatus = agent.status;
        if (action === 'start') newStatus = 'active';
        if (action === 'stop') newStatus = 'stopped';
        if (action === 'restart') newStatus = 'active';

        return {
          ...agent,
          status: newStatus as AgentStatus['status'],
          lastAction: `Agent ${action}ed at ${new Date().toLocaleTimeString()}`
        };
      }
      return agent;
    }));
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Monitor and configure your Stratford AI trading system
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {getStatusIcon(systemStatus.status)}
          <span className="ml-2 capitalize">{systemStatus.status}</span>
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Database className="h-4 w-4 mr-2" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="news">
            <BarChart3 className="h-4 w-4 mr-2" />
            News
          </TabsTrigger>
          <TabsTrigger value="trading">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(systemStatus.uptime)}</div>
                <p className="text-xs text-muted-foreground">
                  Since last restart
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStatus.memoryUsage}MB</div>
                <p className="text-xs text-muted-foreground">
                  Heap memory used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {agents.filter(a => a.status === 'active').length}/{agents.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agents running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(agents.reduce((acc, a) => acc + a.performance, 0) / agents.length)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average efficiency
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Trading Engine</p>
                    <p className="text-sm text-muted-foreground">Processing market data and signals</p>
                  </div>
                  <Badge className={getStatusColor('active')}>
                    {getStatusIcon('active')} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Risk Management</p>
                    <p className="text-sm text-muted-foreground">Monitoring position sizes and exposure</p>
                  </div>
                  <Badge className={getStatusColor('active')}>
                    {getStatusIcon('active')} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Data Pipeline</p>
                    <p className="text-sm text-muted-foreground">Ingesting market data feeds</p>
                  </div>
                  <Badge className={getStatusColor('active')}>
                    {getStatusIcon('active')} Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentDashboard />
        </TabsContent>

        <TabsContent value="trading" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-trading">Auto Trading</Label>
                  <Switch
                    id="auto-trading"
                    checked={settings.autoTrading}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, autoTrading: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="risk-management">Risk Management</Label>
                  <Switch
                    id="risk-management"
                    checked={settings.riskManagement}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, riskManagement: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Position Size: {(settings.maxPositionSize * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[settings.maxPositionSize]}
                    onValueChange={([value]) =>
                      setSettings(prev => ({ ...prev, maxPositionSize: value }))
                    }
                    max={1}
                    min={0.01}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop Loss: {(settings.stopLossThreshold * 100).toFixed(1)}%</Label>
                  <Slider
                    value={[settings.stopLossThreshold]}
                    onValueChange={([value]) =>
                      setSettings(prev => ({ ...prev, stopLossThreshold: value }))
                    }
                    max={0.2}
                    min={0.01}
                    step={0.001}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="real-time">Real-time Analysis</Label>
                  <Switch
                    id="real-time"
                    checked={settings.realTimeAnalysis}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, realTimeAnalysis: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="alerts">Alerts Enabled</Label>
                  <Switch
                    id="alerts"
                    checked={settings.alertsEnabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, alertsEnabled: checked }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh-rate">Refresh Rate (ms)</Label>
                  <Input
                    id="refresh-rate"
                    type="number"
                    value={settings.refreshRate}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, refreshRate: Number(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select
                    id="log-level"
                    className="w-full p-2 border rounded"
                    value={settings.logLevel}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, logLevel: e.target.value }))
                    }
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>System Status</Label>
                  <div className="p-2 border rounded">
                    <Badge className={getStatusColor(systemStatus.status)}>
                      {getStatusIcon(systemStatus.status)} {systemStatus.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-medium mb-2">System Actions</h3>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart System
                  </Button>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600 mb-2">✓ API Security</h3>
                  <p className="text-sm text-muted-foreground">
                    All API endpoints are secured with proper authentication
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600 mb-2">✓ Data Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Trading data is encrypted at rest and in transit
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600 mb-2">✓ Rate Limiting</h3>
                  <p className="text-sm text-muted-foreground">
                    API rate limiting prevents abuse and ensures stability
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Market Data APIs</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Alpha Vantage</h4>
                        <p className="text-sm text-muted-foreground">Stock market data and financial indicators</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="av-key">API Key</Label>
                        <Input id="av-key" type="password" placeholder="Enter Alpha Vantage API key" defaultValue="demo" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="av-calls">Daily Calls</Label>
                          <Input id="av-calls" value="247/500" readOnly />
                        </div>
                        <div>
                          <Label htmlFor="av-rate">Rate Limit</Label>
                          <Input id="av-rate" value="5 calls/min" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Binance API</h4>
                        <p className="text-sm text-muted-foreground">Cryptocurrency trading and market data</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="binance-key">API Key</Label>
                          <Input id="binance-key" type="password" placeholder="Enter Binance API key" />
                        </div>
                        <div>
                          <Label htmlFor="binance-secret">Secret Key</Label>
                          <Input id="binance-secret" type="password" placeholder="Enter secret key" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="binance-testnet" />
                        <Label htmlFor="binance-testnet">Use Testnet</Label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Polygon.io</h4>
                        <p className="text-sm text-muted-foreground">Real-time and historical market data</p>
                      </div>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="polygon-key">API Key</Label>
                        <Input id="polygon-key" type="password" placeholder="Enter Polygon.io API key" />
                      </div>
                      <Button variant="outline">Activate</Button>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-lg pt-4">Sports Betting APIs</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">The Odds API</h4>
                        <p className="text-sm text-muted-foreground">Live odds from 40+ bookmakers</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="odds-key">API Key</Label>
                        <Input id="odds-key" type="password" placeholder="Enter Odds API key" defaultValue="demo" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="odds-calls">Requests Used</Label>
                          <Input id="odds-calls" value="1,247/10,000" readOnly />
                        </div>
                        <div>
                          <Label htmlFor="odds-sports">Sports Enabled</Label>
                          <Input id="odds-sports" value="NFL, NBA, MLB, Soccer" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">SportRadar API</h4>
                        <p className="text-sm text-muted-foreground">Professional sports statistics and data</p>
                      </div>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="sportradar-key">API Key</Label>
                        <Input id="sportradar-key" type="password" placeholder="Enter SportRadar API key" />
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-lg pt-4">Trading & Brokerage APIs</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Robinhood Live Trading</h4>
                        <p className="text-sm text-muted-foreground">Sync your real portfolio and trades</p>
                      </div>
                      <Badge variant="secondary">Not Configured</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="rh-username">Username/Email</Label>
                          <Input id="rh-username" type="email" placeholder="your@email.com" />
                        </div>
                        <div>
                          <Label htmlFor="rh-password">Password</Label>
                          <Input id="rh-password" type="password" placeholder="••••••••" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          🔒 Credentials stored securely in environment variables
                        </p>
                        <Button variant="outline" size="sm">Test Connection</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-lg pt-4">Lottery Data APIs</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Lottery Numbers API</h4>
                        <p className="text-sm text-muted-foreground">Historical lottery results for analysis</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="lottery-source">Data Source</Label>
                        <Input id="lottery-source" value="Multiple State Lotteries" readOnly />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="lottery-history">Historical Data</Label>
                          <Input id="lottery-history" value="10+ years" readOnly />
                        </div>
                        <div>
                          <Label htmlFor="lottery-games">Games Tracked</Label>
                          <Input id="lottery-games" value="Powerball, Mega Millions, Pick 6" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>News & Data Feeds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Financial News Sources</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Bloomberg Terminal</h4>
                        <p className="text-sm text-muted-foreground">Real-time financial news and market data</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="bloomberg" defaultChecked />
                        <Badge variant="default">Live</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stories Today:</span>
                        <div className="font-medium">1,247</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">High Impact:</span>
                        <div className="font-medium">23</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>
                        <div className="font-medium text-green-600">Bullish</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Reuters Market News</h4>
                        <p className="text-sm text-muted-foreground">Global financial market coverage</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="reuters" defaultChecked />
                        <Badge variant="default">Live</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Updates/Hour:</span>
                        <div className="font-medium">45</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Regions:</span>
                        <div className="font-medium">Global</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Languages:</span>
                        <div className="font-medium">EN, ES, FR</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Alpha Intelligence</h4>
                        <p className="text-sm text-muted-foreground">AI-powered market analysis and predictions</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="alpha-intel" defaultChecked />
                        <Badge variant="default">AI</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Predictions:</span>
                        <div className="font-medium">Real-time</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>
                        <div className="font-medium text-green-600">87.3%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Models:</span>
                        <div className="font-medium">GPT-4, Claude</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-lg pt-4">Social Sentiment Analysis</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Twitter/X Sentiment</h4>
                        <p className="text-sm text-muted-foreground">Real-time social media sentiment tracking</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="twitter" defaultChecked />
                        <Badge variant="default">Live</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Mentions/Day:</span>
                        <div className="font-medium">12.5K</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bullish:</span>
                        <div className="font-medium text-green-600">67%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bearish:</span>
                        <div className="font-medium text-red-600">23%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Neutral:</span>
                        <div className="font-medium">10%</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Reddit WallStreetBets</h4>
                        <p className="text-sm text-muted-foreground">Retail investor sentiment and meme stock tracking</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="reddit" defaultChecked />
                        <Badge variant="secondary">Monitoring</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Hot Stocks:</span>
                        <div className="font-medium">NVDA, TSLA, GME</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mentions:</span>
                        <div className="font-medium">2.3K/hour</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>
                        <div className="font-medium text-yellow-600">Mixed</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="font-medium text-lg pt-4">Alternative Data Sources</h3>

                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Satellite Data</h4>
                        <p className="text-sm text-muted-foreground">Economic activity indicators from satellite imagery</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="satellite" />
                        <Badge variant="outline">Premium</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Track economic activity through parking lot occupancy, shipping volumes, and construction activity.
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Weather Impact Analysis</h4>
                        <p className="text-sm text-muted-foreground">Weather effects on agricultural and energy markets</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="weather" defaultChecked />
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Forecast Accuracy:</span>
                        <div className="font-medium">94.2%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Impact Analysis:</span>
                        <div className="font-medium">Real-time</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Feed Processing</h4>
                      <p className="text-sm text-muted-foreground">AI-powered analysis and signal generation</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline">Test All Feeds</Button>
                      <Button>Save Configuration</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
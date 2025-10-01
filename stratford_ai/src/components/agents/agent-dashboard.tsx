'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Plus,
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Settings
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'trading' | 'analysis' | 'risk' | 'monitoring' | 'execution';
  status: 'active' | 'idle' | 'stopped' | 'error' | 'training';
  capabilities: string[];
  performance: {
    score: number;
    accuracy: number;
    speed: number;
    reliability: number;
  };
  stats: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
    uptime: number;
  };
  lastAction: string;
  createdAt: string;
  config: {
    maxConcurrentTasks: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    autoRestart: boolean;
    healthCheckInterval: number;
  };
}

const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'Alpha Trading Engine',
    type: 'trading',
    status: 'active',
    capabilities: ['Moving Average Crossover', 'Risk Assessment', 'Order Execution', 'Position Management'],
    performance: { score: 94, accuracy: 96, speed: 89, reliability: 98 },
    stats: { tasksCompleted: 1247, successRate: 94.2, avgResponseTime: 125, uptime: 99.8 },
    lastAction: 'Executed BUY signal for AAPL at $178.50',
    createdAt: '2024-01-01T00:00:00Z',
    config: { maxConcurrentTasks: 10, priority: 'critical', autoRestart: true, healthCheckInterval: 30 }
  },
  {
    id: 'agent-002',
    name: 'Market Sentiment Analyzer',
    type: 'analysis',
    status: 'active',
    capabilities: ['Sentiment Analysis', 'Technical Indicators', 'Pattern Recognition', 'News Processing'],
    performance: { score: 87, accuracy: 89, speed: 92, reliability: 85 },
    stats: { tasksCompleted: 892, successRate: 87.5, avgResponseTime: 89, uptime: 97.2 },
    lastAction: 'Analyzed 150 news articles for market sentiment',
    createdAt: '2024-01-01T00:00:00Z',
    config: { maxConcurrentTasks: 15, priority: 'high', autoRestart: true, healthCheckInterval: 60 }
  },
  {
    id: 'agent-003',
    name: 'Risk Guardian',
    type: 'risk',
    status: 'idle',
    capabilities: ['Portfolio Risk Analysis', 'VaR Calculation', 'Stress Testing', 'Compliance Monitoring'],
    performance: { score: 97, accuracy: 98, speed: 85, reliability: 99 },
    stats: { tasksCompleted: 445, successRate: 98.1, avgResponseTime: 234, uptime: 99.9 },
    lastAction: 'Completed portfolio risk assessment - All within limits',
    createdAt: '2024-01-01T00:00:00Z',
    config: { maxConcurrentTasks: 5, priority: 'critical', autoRestart: true, healthCheckInterval: 30 }
  },
  {
    id: 'agent-004',
    name: 'System Health Monitor',
    type: 'monitoring',
    status: 'active',
    capabilities: ['System Health Checks', 'Performance Monitoring', 'Alert Management', 'Log Analysis'],
    performance: { score: 99, accuracy: 99, speed: 95, reliability: 99 },
    stats: { tasksCompleted: 2341, successRate: 99.1, avgResponseTime: 45, uptime: 99.9 },
    lastAction: 'System health check passed - All services nominal',
    createdAt: '2024-01-01T00:00:00Z',
    config: { maxConcurrentTasks: 20, priority: 'high', autoRestart: true, healthCheckInterval: 15 }
  },
  {
    id: 'agent-005',
    name: 'Quantum Execution Engine',
    type: 'execution',
    status: 'training',
    capabilities: ['High-Frequency Trading', 'Latency Optimization', 'Order Routing', 'Market Making'],
    performance: { score: 92, accuracy: 94, speed: 98, reliability: 90 },
    stats: { tasksCompleted: 15892, successRate: 92.8, avgResponseTime: 12, uptime: 95.2 },
    lastAction: 'Training on new market microstructure patterns',
    createdAt: '2024-01-01T00:00:00Z',
    config: { maxConcurrentTasks: 50, priority: 'medium', autoRestart: false, healthCheckInterval: 10 }
  }
];

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        stats: {
          ...agent.stats,
          tasksCompleted: agent.status === 'active' ? agent.stats.tasksCompleted + Math.floor(Math.random() * 3) : agent.stats.tasksCompleted,
          avgResponseTime: Math.max(10, agent.stats.avgResponseTime + (Math.random() - 0.5) * 10)
        },
        performance: {
          ...agent.performance,
          score: Math.max(70, Math.min(100, agent.performance.score + (Math.random() - 0.5) * 2))
        }
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'training':
        return <Brain className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Agent['type']) => {
    switch (type) {
      case 'trading':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'analysis':
        return <Brain className="h-5 w-5 text-blue-600" />;
      case 'risk':
        return <Shield className="h-5 w-5 text-red-600" />;
      case 'monitoring':
        return <Eye className="h-5 w-5 text-purple-600" />;
      case 'execution':
        return <Zap className="h-5 w-5 text-orange-600" />;
      default:
        return <Bot className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleAgentAction = (agentId: string, action: 'start' | 'stop' | 'restart') => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        let newStatus: Agent['status'] = agent.status;
        if (action === 'start') newStatus = 'active';
        if (action === 'stop') newStatus = 'stopped';
        if (action === 'restart') newStatus = 'active';

        return {
          ...agent,
          status: newStatus,
          lastAction: `Agent ${action}ed at ${new Date().toLocaleTimeString()}`
        };
      }
      return agent;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Agent Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">AI agents deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {agents.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(agents.reduce((acc, a) => acc + a.performance.score, 0) / agents.length)}%
            </div>
            <p className="text-xs text-muted-foreground">System efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((acc, a) => acc + a.stats.tasksCompleted, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total executed</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Agents</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Deploy New Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedAgent?.id === agent.id ? 'border-primary bg-muted/50' : ''
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-muted">
                      {getTypeIcon(agent.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.lastAction}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge className={getStatusColor(agent.status)}>
                          {getStatusIcon(agent.status)} {agent.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Performance: {agent.performance.score}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Tasks: {agent.stats.tasksCompleted.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Success: {agent.stats.successRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={agent.performance.score} className="w-20" />
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentAction(agent.id, 'start');
                        }}
                        disabled={agent.status === 'active'}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentAction(agent.id, 'stop');
                        }}
                        disabled={agent.status === 'stopped'}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgentAction(agent.id, 'restart');
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Details - {selectedAgent.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capabilities */}
              <div>
                <h3 className="font-medium mb-3">Capabilities</h3>
                <div className="space-y-2">
                  {selectedAgent.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium mb-3">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedAgent.performance.score} className="w-20" />
                      <span className="text-sm font-medium">{selectedAgent.performance.score}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accuracy</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedAgent.performance.accuracy} className="w-20" />
                      <span className="text-sm font-medium">{selectedAgent.performance.accuracy}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speed</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedAgent.performance.speed} className="w-20" />
                      <span className="text-sm font-medium">{selectedAgent.performance.speed}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reliability</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedAgent.performance.reliability} className="w-20" />
                      <span className="text-sm font-medium">{selectedAgent.performance.reliability}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="font-medium mb-3">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tasks Completed:</span>
                    <span className="font-medium">{selectedAgent.stats.tasksCompleted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium">{selectedAgent.stats.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response Time:</span>
                    <span className="font-medium">{selectedAgent.stats.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-medium">{selectedAgent.stats.uptime}%</span>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="font-medium mb-3">Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Concurrent Tasks:</span>
                    <span className="font-medium">{selectedAgent.config.maxConcurrentTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <Badge variant={selectedAgent.config.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {selectedAgent.config.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Restart:</span>
                    <span className="font-medium">{selectedAgent.config.autoRestart ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Check Interval:</span>
                    <span className="font-medium">{selectedAgent.config.healthCheckInterval}s</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
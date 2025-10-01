'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function SecurityPage() {
  const securityMetrics = [
    { label: 'Encryption Status', value: 'AES-256', status: 'active' },
    { label: 'Authentication', value: '2FA Enabled', status: 'active' },
    { label: 'API Rate Limiting', value: '1000/hour', status: 'active' },
    { label: 'Risk Assessment', value: 'Low', status: 'good' },
  ];

  const recentAlerts = [
    { type: 'info', message: 'Daily security scan completed', time: '2 min ago', severity: 'low' },
    { type: 'warning', message: 'Unusual trading pattern detected', time: '15 min ago', severity: 'medium' },
    { type: 'success', message: 'Portfolio rebalancing completed', time: '1 hour ago', severity: 'low' },
    { type: 'error', message: 'API rate limit approached', time: '2 hours ago', severity: 'high' },
  ];

  const riskFactors = [
    { name: 'Market Volatility', level: 65, status: 'warning' },
    { name: 'Position Concentration', level: 35, status: 'good' },
    { name: 'Leverage Exposure', level: 20, status: 'good' },
    { name: 'Liquidity Risk', level: 45, status: 'warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security & Risk</h1>
            <p className="text-muted-foreground">
              System security monitoring and risk management
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">92/100</div>
              <p className="text-xs text-muted-foreground">
                Excellent security posture
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">Medium</div>
              <p className="text-xs text-muted-foreground">
                2 factors need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                All systems monitored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">
                All regulations met
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>
                Current security measures and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {metric.status === 'active' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                    </div>
                    <Badge variant={metric.status === 'active' ? 'default' : 'destructive'}>
                      {metric.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>
                Latest security events and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                      {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {alert.type === 'info' && <Eye className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">{alert.time}</div>
                    </div>
                    <Badge
                      variant={
                        alert.severity === 'high' ? 'destructive' :
                        alert.severity === 'medium' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Current risk factors and their impact levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {riskFactors.map((factor) => (
                <div key={factor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{factor.level}%</span>
                      <Badge
                        variant={factor.status === 'good' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {factor.status === 'good' ? 'OK' : 'WATCH'}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={factor.level}
                    className={`h-2 ${factor.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                User permissions and access management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Admin Access</span>
                  <Badge variant="destructive">Restricted</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trading Permissions</span>
                  <Badge variant="default">Full Access</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Access</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Export</span>
                  <Badge variant="secondary">Limited</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Recent system access and modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Settings updated</div>
                  <div className="text-muted-foreground">User: admin@stratford.ai • 5 min ago</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Portfolio accessed</div>
                  <div className="text-muted-foreground">User: trader@stratford.ai • 23 min ago</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Security scan initiated</div>
                  <div className="text-muted-foreground">System: automated • 1 hour ago</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">API key rotated</div>
                  <div className="text-muted-foreground">System: automated • 2 hours ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
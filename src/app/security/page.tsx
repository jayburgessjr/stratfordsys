'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Eye, RefreshCw, Activity } from 'lucide-react';
import { getSecurityRiskService, type SecurityDashboard } from '@/lib/services/security-risk';

export default function SecurityPage() {
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const service = getSecurityRiskService();
      const data = await service.getSecurityDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading security metrics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security & Risk</h1>
            <p className="text-muted-foreground">
              Real-time security monitoring and portfolio risk assessment
            </p>
          </div>
          <Button onClick={loadSecurityData} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboard.securityScore >= 80 ? 'text-green-600' : dashboard.securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {dashboard.securityScore}/100
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.securityScore >= 80 ? 'Excellent' : dashboard.securityScore >= 60 ? 'Good' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboard.riskLevel === 'Low' ? 'text-green-600' : dashboard.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                {dashboard.riskLevel}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.riskFactorCount} factor{dashboard.riskFactorCount !== 1 ? 's' : ''} need{dashboard.riskFactorCount === 1 ? 's' : ''} attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.activeMonitors}</div>
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
              <div className="text-2xl font-bold text-green-600">{dashboard.complianceScore}%</div>
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
                {dashboard.securityMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {metric.status === 'active' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : metric.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                    </div>
                    <Badge variant={metric.status === 'active' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
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
                {dashboard.recentAlerts.map((alert) => {
                  const service = getSecurityRiskService();
                  return (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2">
                        {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {alert.type === 'info' && <Eye className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{alert.message}</div>
                        <div className="text-xs text-muted-foreground">{service.formatTimeAgo(alert.time)}</div>
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
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Real-time portfolio risk factors calculated from live data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {dashboard.riskFactors.map((factor) => (
                <div key={factor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{factor.level}%</span>
                      <Badge
                        variant={factor.status === 'good' ? 'default' : factor.status === 'warning' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {factor.status === 'good' ? 'OK' : factor.status === 'warning' ? 'WATCH' : 'CRITICAL'}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={factor.level}
                    className={`h-2 ${factor.status === 'critical' ? '[&>div]:bg-red-600' : factor.status === 'warning' ? '[&>div]:bg-yellow-600' : '[&>div]:bg-green-600'}`}
                  />
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
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
                {dashboard.auditTrail.map((event, index) => {
                  const service = getSecurityRiskService();
                  return (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{event.action}</div>
                      <div className="text-muted-foreground">
                        User: {event.user} • {service.formatTimeAgo(event.timestamp)}
                      </div>
                      {event.details && (
                        <div className="text-xs text-muted-foreground mt-1">{event.details}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
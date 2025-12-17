'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquityCurveChart } from '@/components/dashboard/equity-curve-chart';
import { TradingActivity } from '@/components/dashboard/trading-activity';
import { RiskAnalysis } from '@/components/dashboard/risk-analysis';
import { AITradingSignals } from '@/components/dashboard/ai-trading-signals';
import { Bot, LineChart, Shield, Zap, TrendingUp, Activity, DollarSign, Wallet } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header Section - Rigid Height */}
        <div className="flex flex-none justify-between items-center px-1">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              Command Center
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              System Healthy
            </Button>
            <Button variant="cosmic" size="sm" className="gap-2 shadow-primary/25 h-8">
              <Zap className="h-3.5 w-3.5" />
              Deploy Strategy
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid - Rigid Height */}
        <div className="grid grid-cols-4 gap-4 flex-none">
          {[
            {
              title: "Total Equity",
              value: "$124,592.00",
              change: "+12.5%",
              icon: Wallet,
              color: "text-emerald-400"
            },
            {
              title: "Daily P&L",
              value: "+$1,250.40",
              change: "+3.2%",
              icon: DollarSign,
              color: "text-emerald-400"
            },
            {
              title: "Active Positions",
              value: "8",
              change: "-2",
              icon: Activity,
              color: "text-blue-400"
            },
            {
              title: "Win Rate",
              value: "68.5%",
              change: "+1.2%",
              icon: TrendingUp,
              color: "text-purple-400"
            }
          ].map((metric, i) => (
            <Card key={i} className="group hover:-translate-y-1 transition-transform duration-300 bg-black/40 backdrop-blur-sm border-white/5">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-zinc-400">{metric.title}</p>
                  <metric.icon className={`h-3.5 w-3.5 ${metric.color} opacity-70`} />
                </div>
                <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
                <div className="flex items-center text-[10px] text-muted-foreground">
                  <span className={`${metric.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'} font-medium mr-1`}>
                    {metric.change}
                  </span>
                  from last month
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Info - Fills remaining height */}
        <Tabs defaultValue="performance" className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 flex-none">
            <TabsList className="bg-black/40 border border-white/5 backdrop-blur-md p-0.5 h-8">
              <TabsTrigger value="performance" className="text-xs h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Performance</TabsTrigger>
              <TabsTrigger value="ai-signals" className="text-xs h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">AI Signals</TabsTrigger>
              <TabsTrigger value="risk" className="text-xs h-7 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Risk Monitor</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="performance" className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden">
            <div className="grid grid-cols-7 gap-6 h-full">
              {/* Equity Curve (Main Chart) - Fills Height */}
              <div className="col-span-5 flex flex-col h-full bg-black/20 rounded-xl border border-white/5 p-4 relative backdrop-blur-sm">
                <h3 className="text-sm font-medium text-zinc-400 absolute top-4 left-4 z-10">Equity Growth</h3>
                <div className="flex-1 w-full min-h-0">
                  {/* Assuming EquityCurveChart is responsive to parent height */}
                  <EquityCurveChart />
                </div>
              </div>

              {/* Sidebar Stats / Recent Activity - Fills Height, Scrolls Internally */}
              <div className="col-span-2 h-full min-h-0">
                <Card className="h-full flex flex-col border-white/5 bg-black/20">
                  <CardHeader className="py-3 px-4 flex-none border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    <TradingActivity />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-signals" className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden overflow-y-auto">
            <AITradingSignals />
          </TabsContent>

          <TabsContent value="risk" className="flex-1 mt-0 min-h-0 data-[state=inactive]:hidden overflow-y-auto">
            <div className="grid grid-cols-1 gap-6">
              <RiskAnalysis />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
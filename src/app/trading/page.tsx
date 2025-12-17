'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

export default function TradingPage() {
  // Use flex-col h-full to fill available space from DashboardLayout
  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col gap-4">

        {/* Header - Fixed Height */}
        <div className="flex items-center justify-between flex-none px-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Live Trading</h1>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh Data
          </Button>
        </div>

        {/* Top Stats Row - Fixed Height */}
        <div className="grid grid-cols-4 gap-4 flex-none">
          <Card className="border-l-4 border-l-primary/50 bg-black/40 backdrop-blur-sm border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-medium text-zinc-400">P&L Today</p>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400">+$2,341.50</div>
              <p className="text-[10px] text-muted-foreground">+12.5% vs yday</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500/50 bg-black/40 backdrop-blur-sm border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-medium text-zinc-400">Active Trades</p>
                <Activity className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">3</div>
              <p className="text-[10px] text-muted-foreground">2 Long, 1 Short</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500/50 bg-black/40 backdrop-blur-sm border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-medium text-zinc-400">Win Rate</p>
                <DollarSign className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-white">78.4%</div>
              <p className="text-[10px] text-muted-foreground">High Prob. Mode</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500/50 bg-black/40 backdrop-blur-sm border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-medium text-zinc-400">Exposure</p>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">Medium</div>
              <p className="text-[10px] text-muted-foreground">15% Allocated</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Workspace - Fills Remaining Height */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Order Entry - Fills Height */}
          <div className="lg:col-span-1 h-full min-h-0">
            <Card className="h-full flex flex-col bg-black/20 border-white/5">
              <CardHeader className="py-3 flex-none border-b border-white/5">
                <CardTitle className="text-sm">Order Entry</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/40 h-9">
                    <TabsTrigger value="buy" className="text-xs data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">Buy / Long</TabsTrigger>
                    <TabsTrigger value="sell" className="text-xs data-[state=active]:bg-rose-600/20 data-[state=active]:text-rose-400">Sell / Short</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-medium text-muted-foreground">Symbol</label>
                      <Input placeholder="e.g. BTC-USD" defaultValue="BTC-USD" className="font-mono h-9 text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-medium text-muted-foreground">Type</label>
                        <Select defaultValue="limit">
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="limit">Limit</SelectItem>
                            <SelectItem value="stop">Stop</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-medium text-muted-foreground">Leverage</label>
                        <Select defaultValue="1x">
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Lev" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1x">1x</SelectItem>
                            <SelectItem value="2x">2x</SelectItem>
                            <SelectItem value="5x">5x</SelectItem>
                            <SelectItem value="10x">10x</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-medium text-muted-foreground">Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground text-sm">$</span>
                        <Input type="number" defaultValue="64230.50" className="pl-6 font-mono h-9 text-sm" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-medium text-muted-foreground">Quantity</label>
                      <Input type="number" defaultValue="0.5" className="font-mono h-9 text-sm" />
                    </div>

                    <div className="pt-2">
                      <div className="text-[10px] text-muted-foreground flex justify-between mb-2">
                        <span>Est. Cost</span>
                        <span className="font-mono text-white">$32,115.25</span>
                      </div>
                      <Button variant="cosmic" className="w-full h-10 text-sm shadow-emerald-500/20">
                        Submit Order
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Positions & Market Data - Fills Height */}
          <div className="lg:col-span-2 h-full min-h-0 flex flex-col gap-4">
            {/* Active Positions - Flexible Height */}
            <Card className="flex-1 flex flex-col min-h-0 bg-black/20 border-white/5">
              <CardHeader className="py-3 flex-none border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Active Positions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10">
                <div className="divide-y divide-white/5">
                  {[
                    { symbol: 'BTC-USD', side: 'Long', entry: '62,450.00', current: '64,230.50', pnl: '+1,780.50', pnlPercent: '+2.85%', color: 'text-emerald-400' },
                    { symbol: 'ETH-USD', side: 'Long', entry: '3,320.00', current: '3,450.10', pnl: '+130.10', pnlPercent: '+3.92%', color: 'text-emerald-400' },
                    { symbol: 'TSLA', side: 'Short', entry: '245.50', current: '240.20', pnl: '+5.30', pnlPercent: '+2.16%', color: 'text-emerald-400' },
                    { symbol: 'SPY', side: 'Long', entry: '408.00', current: '412.35', pnl: '+435.00', pnlPercent: '+1.06%', color: 'text-emerald-400' },
                    { symbol: 'NVDA', side: 'Long', entry: '850.00', current: '875.30', pnl: '+2,530.00', pnlPercent: '+2.98%', color: 'text-emerald-400' },
                  ].map((pos, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${pos.side === 'Long' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                          {pos.side === 'Long' ? <ArrowUpRight className={`h-3.5 w-3.5 ${pos.side === 'Long' ? 'text-emerald-400' : 'text-rose-400'}`} /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{pos.symbol} <span className="text-[10px] text-muted-foreground ml-1">{pos.side}</span></div>
                          <div className="text-[10px] text-muted-foreground font-mono">Entry: {pos.entry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold font-mono text-sm ${pos.color}`}>{pos.pnlPercent}</div>
                        <div className={`text-[10px] ${pos.color} font-mono`}>{pos.pnl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Executions - Fixed Height Block */}
            <Card className="flex-none h-48 flex flex-col bg-black/20 border-white/5">
              <CardHeader className="py-2.5 flex-none border-b border-white/5">
                <CardTitle className="text-sm">Recent Executions</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-white/10">
                <div className="divide-y divide-white/5">
                  <div className="flex justify-between text-[10px] text-muted-foreground px-3 py-2 bg-black/20">
                    <span>Symbol</span>
                    <span>Action</span>
                    <span>Price</span>
                    <span>Time</span>
                  </div>
                  {[
                    { s: 'AAPL', a: 'Buy', p: '172.50', t: '10:30 AM' },
                    { s: 'MSFT', a: 'Sell', p: '410.20', t: '11:15 AM' },
                    { s: 'NVDA', a: 'Buy', p: '865.00', t: '11:45 AM' },
                    { s: 'BTC-USD', a: 'Buy', p: '63,500.00', t: '12:05 PM' },
                    { s: 'ETH-USD', a: 'Buy', p: '3,420.00', t: '12:10 PM' },
                  ].map((trade, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2 hover:bg-white/5 text-xs transition-colors">
                      <span className="font-semibold">{trade.s}</span>
                      <span className={trade.a === 'Buy' ? 'text-emerald-400' : 'text-rose-400'}>{trade.a}</span>
                      <span className="font-mono">{trade.p}</span>
                      <span className="text-muted-foreground">{trade.t}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
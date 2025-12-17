'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExecutionLog {
  id: string;
  asset: string;
  type: 'LONG' | 'SHORT' | 'BET';
  entryPrice: number;
  capital: number;
  date: string;
  notes?: string;
}

export default function LogExecutionPage() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [newLog, setNewLog] = useState<Partial<ExecutionLog>>({
    asset: '',
    type: 'LONG',
    entryPrice: 0,
    capital: 0,
    date: new Date().toISOString().split('T')[0],
  });

  // Load saved logs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('execution_log');
    if (saved) {
      setLogs(JSON.parse(saved));
    }
  }, []);

  const addLog = () => {
    if (!newLog.asset || !newLog.entryPrice || !newLog.capital) {
      alert('Please fill in all required fields');
      return;
    }

    const entry: ExecutionLog = {
      id: crypto.randomUUID(),
      asset: newLog.asset.toUpperCase(),
      type: newLog.type as 'LONG' | 'SHORT' | 'BET',
      entryPrice: Number(newLog.entryPrice),
      capital: Number(newLog.capital),
      date: newLog.date || new Date().toISOString().split('T')[0],
      notes: newLog.notes
    };

    const updated = [entry, ...logs];
    setLogs(updated);
    localStorage.setItem('execution_log', JSON.stringify(updated));

    // Reset form
    setNewLog({
      asset: '',
      type: 'LONG',
      entryPrice: 0,
      capital: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const removeLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem('execution_log', JSON.stringify(updated));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear the execution history?')) {
      setLogs([]);
      localStorage.removeItem('execution_log');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Execution</h1>
          <p className="text-muted-foreground">
            Record your actions based on AI predictions to track real-world accuracy.
          </p>
        </div>

        {/* Add New Log */}
        <Card className="bg-black/40 border-white/5">
          <CardHeader>
            <CardTitle>Record Transaction</CardTitle>
            <CardDescription>
              Log a trade or bet to track against system predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-1">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newLog.type} 
                  onValueChange={(val) => setNewLog({ ...newLog, type: val as any })}
                >
                  <SelectTrigger className="bg-black/20">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">Long (Buy)</SelectItem>
                    <SelectItem value="SHORT">Short (Sell)</SelectItem>
                    <SelectItem value="BET">Wager/Bet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="asset">Asset / Event</Label>
                <Input
                  id="asset"
                  placeholder="BTC, SPY, LAL vs BOS"
                  value={newLog.asset}
                  onChange={(e) => setNewLog({ ...newLog, asset: e.target.value })}
                  className="bg-black/20"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="price">Entry Price / Odds</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="45000.00"
                  value={newLog.entryPrice || ''}
                  onChange={(e) => setNewLog({ ...newLog, entryPrice: parseFloat(e.target.value) || 0 })}
                  className="bg-black/20"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="capital">Capital Deployed</Label>
                <Input
                  id="capital"
                  type="number"
                  step="1"
                  placeholder="1000"
                  value={newLog.capital || ''}
                  onChange={(e) => setNewLog({ ...newLog, capital: parseFloat(e.target.value) || 0 })}
                  className="bg-black/20"
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newLog.date}
                  onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  className="bg-black/20"
                />
              </div>
              <div className="flex items-end md:col-span-1">
                <Button onClick={addLog} className="w-full" variant="cosmic">
                  <Plus className="h-4 w-4 mr-2" />
                  Log
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Logs */}
        <Card className="bg-black/20 border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Execution History ({logs.length})</CardTitle>
                <CardDescription>
                  Your tracked performance
                </CardDescription>
              </div>
              {logs.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAll} className="border-red-500/20 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No executions logged yet.</p>
                <p className="text-sm mt-2">Record your first trade or wager above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border border-white/5 bg-black/40 rounded-lg hover:border-white/10 transition-colors">
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={log.type === 'LONG' ? 'default' : log.type === 'SHORT' ? 'destructive' : 'secondary'} className="w-16 justify-center">
                          {log.type}
                        </Badge>
                        <div className="font-bold text-white">{log.asset}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Entry Price</div>
                        <div className="font-mono text-sm">${log.entryPrice.toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Capital</div>
                        <div className="font-mono text-sm">${log.capital.toLocaleString()}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Date</div>
                        <div className="text-sm">{log.date}</div>
                      </div>
                      
                      {/* Placeholder for real-time status update */}
                      <div>
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="text-sm text-emerald-400 flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Tracking
                        </div>
                      </div>

                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLog(log.id)}
                      className="ml-4 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


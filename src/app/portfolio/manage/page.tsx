'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Upload } from 'lucide-react';

interface ManualPosition {
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: string;
}

export default function ManagePortfolioPage() {
  const [positions, setPositions] = useState<ManualPosition[]>([]);
  const [newPosition, setNewPosition] = useState<ManualPosition>({
    symbol: '',
    shares: 0,
    costBasis: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Load saved positions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('manual_portfolio');
    if (saved) {
      setPositions(JSON.parse(saved));
    }
  }, []);

  const addPosition = () => {
    if (!newPosition.symbol || newPosition.shares <= 0 || newPosition.costBasis <= 0) {
      alert('Please fill in all fields correctly');
      return;
    }

    const updated = [...positions, { ...newPosition, symbol: newPosition.symbol.toUpperCase() }];
    setPositions(updated);
    localStorage.setItem('manual_portfolio', JSON.stringify(updated));

    // Reset form
    setNewPosition({
      symbol: '',
      shares: 0,
      costBasis: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    });
  };

  const removePosition = (index: number) => {
    const updated = positions.filter((_, i) => i !== index);
    setPositions(updated);
    localStorage.setItem('manual_portfolio', JSON.stringify(updated));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all positions?')) {
      setPositions([]);
      localStorage.removeItem('manual_portfolio');
    }
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      const imported: ManualPosition[] = [];

      lines.forEach(line => {
        const [symbol, shares, costBasis, date] = line.split(',');
        if (symbol && shares && costBasis) {
          imported.push({
            symbol: symbol.trim().toUpperCase(),
            shares: parseFloat(shares),
            costBasis: parseFloat(costBasis),
            purchaseDate: date?.trim() || new Date().toISOString().split('T')[0],
          });
        }
      });

      if (imported.length > 0) {
        const updated = [...positions, ...imported];
        setPositions(updated);
        localStorage.setItem('manual_portfolio', JSON.stringify(updated));
        alert(`Imported ${imported.length} positions`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Portfolio</h1>
          <p className="text-muted-foreground">
            Add your actual stock positions to track with real-time prices
          </p>
        </div>

        {/* Add New Position */}
        <Card>
          <CardHeader>
            <CardTitle>Add Position</CardTitle>
            <CardDescription>
              Enter your stock holdings manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="AAPL"
                  value={newPosition.symbol}
                  onChange={(e) => setNewPosition({ ...newPosition, symbol: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="shares">Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.0001"
                  placeholder="100"
                  value={newPosition.shares || ''}
                  onChange={(e) => setNewPosition({ ...newPosition, shares: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost Basis ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={newPosition.costBasis || ''}
                  onChange={(e) => setNewPosition({ ...newPosition, costBasis: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="date">Purchase Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newPosition.purchaseDate}
                  onChange={(e) => setNewPosition({ ...newPosition, purchaseDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addPosition} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Positions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Positions ({positions.length})</CardTitle>
                <CardDescription>
                  These will be tracked with real-time prices from Alpha Vantage
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="csv-import" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </label>
                </Button>
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={importFromCSV}
                />
                {positions.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No positions added yet.</p>
                <p className="text-sm mt-2">Add your first position above or import from CSV</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((pos, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Symbol</div>
                        <div className="font-medium">{pos.symbol}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Shares</div>
                        <div className="font-medium">{pos.shares.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Cost Basis</div>
                        <div className="font-medium">${pos.costBasis.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Purchase Date</div>
                        <div className="font-medium">{pos.purchaseDate}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePosition(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CSV Format Info */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Import Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-sm">
              <div>Symbol,Shares,CostBasis,PurchaseDate</div>
              <div>AAPL,100,150.25,2024-01-15</div>
              <div>MSFT,50,380.50,2024-02-20</div>
              <div>GOOGL,30,142.75,2024-03-10</div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Export your positions from Robinhood or your broker, then import here
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

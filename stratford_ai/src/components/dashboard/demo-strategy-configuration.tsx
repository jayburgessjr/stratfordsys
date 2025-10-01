'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, RotateCcw, TrendingUp, Info } from 'lucide-react';

interface StrategyParameter {
  name: string;
  value: number | string;
  description: string;
  type: 'number' | 'select' | 'boolean';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export function DemoStrategyConfiguration() {
  const [isRunning, setIsRunning] = useState(false);

  // Strategy configuration state
  const [parameters, setParameters] = useState<StrategyParameter[]>([
    {
      name: 'Short Period',
      value: 20,
      description: 'Period for the fast moving average',
      type: 'number',
      min: 5,
      max: 100,
      step: 1
    },
    {
      name: 'Long Period',
      value: 50,
      description: 'Period for the slow moving average',
      type: 'number',
      min: 10,
      max: 200,
      step: 1
    },
    {
      name: 'MA Type',
      value: 'SIMPLE',
      description: 'Type of moving average calculation',
      type: 'select',
      options: ['SIMPLE', 'EXPONENTIAL', 'WEIGHTED']
    },
    {
      name: 'Signal Delay',
      value: 0,
      description: 'Number of periods to delay signal execution',
      type: 'number',
      min: 0,
      max: 10,
      step: 1
    }
  ]);

  const [riskConfig, setRiskConfig] = useState({
    maxPositionSize: 0.95,
    commission: 0.001,
    slippage: 0.0005
  });

  const handleParameterChange = (paramIndex: number, newValue: number | string) => {
    const updatedParams = [...parameters];
    const param = updatedParams[paramIndex];
    if (param) {
      param.value = newValue;
      setParameters(updatedParams);
    }
  };

  const handleRunBacktest = async () => {
    setIsRunning(true);
    // Simulate backtest running
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const resetToDefaults = () => {
    setParameters([
      {
        name: parameters[0].name,
        value: 20,
        description: parameters[0].description,
        type: parameters[0].type,
        min: parameters[0].min,
        max: parameters[0].max,
        step: parameters[0].step
      },
      {
        name: parameters[1].name,
        value: 50,
        description: parameters[1].description,
        type: parameters[1].type,
        min: parameters[1].min,
        max: parameters[1].max,
        step: parameters[1].step
      },
      {
        name: parameters[2].name,
        value: 'SIMPLE',
        description: parameters[2].description,
        type: parameters[2].type,
        options: parameters[2].options
      },
      {
        name: parameters[3].name,
        value: 0,
        description: parameters[3].description,
        type: parameters[3].type,
        min: parameters[3].min,
        max: parameters[3].max,
        step: parameters[3].step
      }
    ]);
    setRiskConfig({
      maxPositionSize: 0.95,
      commission: 0.001,
      slippage: 0.0005
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Strategy Configuration
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="flex items-center gap-1"
            >
              {isRunning ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {isRunning ? 'Running...' : 'Run Backtest'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Strategy Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Moving Average Crossover</h3>
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trend Following
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A classic trend-following strategy that generates buy/sell signals when a fast moving average
              crosses above/below a slow moving average.
            </p>
          </div>

          {/* Strategy Parameters */}
          <div className="space-y-4">
            <h4 className="text-md font-medium">Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parameters.map((param, index) => (
                <div key={param.name} className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {param.name}
                    <div className="group relative">
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {param.description}
                      </div>
                    </div>
                  </label>
                  {param.type === 'number' ? (
                    <input
                      type="number"
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, Number(e.target.value))}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : param.type === 'select' ? (
                    <select
                      value={param.value}
                      onChange={(e) => handleParameterChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {param.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-4">
            <h4 className="text-md font-medium">Risk Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Position Size</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={riskConfig.maxPositionSize}
                    onChange={(e) =>
                      setRiskConfig({
                        ...riskConfig,
                        maxPositionSize: Number(e.target.value)
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-mono min-w-12">
                    {(riskConfig.maxPositionSize * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commission</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={riskConfig.commission * 100}
                    onChange={(e) =>
                      setRiskConfig({
                        ...riskConfig,
                        commission: Number(e.target.value) / 100
                      })
                    }
                    min="0"
                    max="1"
                    step="0.01"
                    className="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slippage</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={riskConfig.slippage * 100}
                    onChange={(e) =>
                      setRiskConfig({
                        ...riskConfig,
                        slippage: Number(e.target.value) / 100
                      })
                    }
                    min="0"
                    max="0.5"
                    step="0.01"
                    className="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Results Summary */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-md font-medium">Current Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Total Return</div>
                <div className="text-lg font-bold text-green-600">12.45%</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Sharpe Ratio</div>
                <div className="text-lg font-bold">1.42</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Max Drawdown</div>
                <div className="text-lg font-bold text-red-600">8.7%</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Win Rate</div>
                <div className="text-lg font-bold text-green-600">64.2%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
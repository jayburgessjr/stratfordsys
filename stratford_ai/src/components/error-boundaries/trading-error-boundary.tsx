'use client'

/**
 * Trading-Specific Error Boundary
 * Specialized error handling for financial trading operations
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { captureError, addBreadcrumb } from '@/lib/monitoring/error-tracking'
import { TrendingDown, AlertCircle, RefreshCw, PhoneCall } from 'lucide-react'

interface Props {
  children: ReactNode
  portfolioId?: string
  operation?: 'trading' | 'portfolio' | 'market_data' | 'analysis'
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  isTrading: boolean
}

export class TradingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isTrading: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { portfolioId, operation } = this.props

    // Determine if this is a critical trading error
    const isCriticalTradingError = this.isCriticalTradingError(error)

    // Add trading-specific breadcrumb
    addBreadcrumb({
      category: 'trading',
      message: `Trading error in ${operation || 'unknown'} operation`,
      level: isCriticalTradingError ? 'error' : 'warning',
      data: {
        portfolioId,
        operation,
        errorType: error.constructor.name,
        isCritical: isCriticalTradingError,
        componentStack: errorInfo.componentStack,
      },
    })

    // Capture error with trading-specific context
    const errorId = captureError(error, {
      component: 'TradingErrorBoundary',
      action: 'trading_error',
      metadata: {
        portfolioId,
        operation,
        isCriticalTradingError,
        componentStack: errorInfo.componentStack,
        tradingSession: this.getCurrentTradingSession(),
        marketStatus: this.getMarketStatus(),
      },
    }, {
      severity: isCriticalTradingError ? 'critical' : 'high',
      category: 'trading_error',
      tags: ['trading', operation || 'unknown', portfolioId || 'no-portfolio'],
    })

    this.setState({
      errorInfo,
      errorId,
      isTrading: isCriticalTradingError,
    })

    // Trigger immediate alert for critical trading errors
    if (isCriticalTradingError) {
      this.triggerEmergencyAlert(error, errorId)
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private isCriticalTradingError(error: Error): boolean {
    const criticalKeywords = [
      'order',
      'trade',
      'position',
      'portfolio',
      'balance',
      'transaction',
      'settlement',
      'execution',
      'price',
      'market_data',
    ]

    const errorMessage = error.message.toLowerCase()
    const errorStack = (error.stack || '').toLowerCase()

    return criticalKeywords.some(keyword =>
      errorMessage.includes(keyword) || errorStack.includes(keyword)
    )
  }

  private getCurrentTradingSession(): string {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 9 && hour < 16) {
      return 'regular_hours'
    } else if (hour >= 4 && hour < 9) {
      return 'pre_market'
    } else if (hour >= 16 && hour < 20) {
      return 'after_hours'
    } else {
      return 'closed'
    }
  }

  private getMarketStatus(): string {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()

    // Weekend
    if (day === 0 || day === 6) {
      return 'closed_weekend'
    }

    // Market hours (9:30 AM - 4:00 PM ET)
    if (hour >= 9 && hour < 16) {
      return 'open'
    } else {
      return 'closed'
    }
  }

  private async triggerEmergencyAlert(error: Error, errorId: string): Promise<void> {
    try {
      // This would integrate with your alerting system
      await fetch('/api/alerts/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          portfolioId: this.props.portfolioId,
          operation: this.props.operation,
          timestamp: new Date().toISOString(),
          severity: 'critical',
        }),
      })
    } catch (alertError) {
      console.error('Failed to trigger emergency alert:', alertError)
    }
  }

  private handleRefresh = (): void => {
    addBreadcrumb({
      category: 'user_action',
      message: 'User refreshed trading component',
      level: 'info',
      data: {
        errorId: this.state.errorId,
        operation: this.props.operation,
      },
    })

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isTrading: false,
    })
  }

  private handleContactSupport = (): void => {
    const { errorId } = this.state
    const { portfolioId, operation } = this.props

    const supportUrl = `mailto:trading-support@stratford-ai.com?subject=Critical Trading Error - ${errorId}&body=` +
      encodeURIComponent(`
Critical Trading Error Report

Error ID: ${errorId}
Portfolio ID: ${portfolioId || 'N/A'}
Operation: ${operation || 'N/A'}
Time: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:


This is an automated error report from Stratford AI Trading Platform.
      `)

    window.location.href = supportUrl

    addBreadcrumb({
      category: 'user_action',
      message: 'User contacted support for trading error',
      level: 'info',
      data: { errorId, portfolioId, operation },
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorId, isTrading } = this.state
      const { operation } = this.props

      return (
        <div className={`rounded-lg p-6 ${isTrading ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border-2`}>
          <div className="flex items-center mb-4">
            {isTrading ? (
              <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${isTrading ? 'text-red-800' : 'text-yellow-800'}`}>
                {isTrading ? 'Critical Trading Error' : 'Trading System Issue'}
              </h3>
              <p className={`text-sm ${isTrading ? 'text-red-600' : 'text-yellow-600'}`}>
                Error in {operation || 'trading'} operation
              </p>
            </div>
          </div>

          {isTrading && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-red-800 font-medium text-sm">
                ⚠️ CRITICAL: This error may affect your trading positions or portfolio data.
                Trading support has been automatically notified.
              </p>
            </div>
          )}

          {errorId && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800 text-sm">
                <strong>Error Reference:</strong> {errorId}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Quote this reference when contacting support
              </p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-4">
              <details className="bg-gray-100 rounded p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Technical Details (Development)
                </summary>
                <div className="mt-2 text-xs">
                  <p className="font-medium text-red-600">{error.message}</p>
                  {error.stack && (
                    <pre className="mt-2 overflow-auto text-gray-600 whitespace-pre-wrap max-h-32">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleRefresh}
              className={`flex-1 ${
                isTrading ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
              } text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2`}
            >
              <RefreshCw className="h-4 w-4" />
              Retry Operation
            </button>

            {isTrading && (
              <button
                onClick={this.handleContactSupport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                Contact Trading Support
              </button>
            )}
          </div>

          {isTrading && (
            <div className="mt-4 pt-3 border-t border-red-200">
              <p className="text-red-700 text-xs">
                <strong>Trading Hours Support:</strong> 1-800-STRATFORD (24/7 during market hours)
              </p>
              <p className="text-red-600 text-xs mt-1">
                For immediate assistance with critical trading issues
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for trading components
export function withTradingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  operation?: 'trading' | 'portfolio' | 'market_data' | 'analysis'
) {
  const WrappedComponent = (props: P & { portfolioId?: string }) => (
    <TradingErrorBoundary portfolioId={props.portfolioId} operation={operation}>
      <Component {...props} />
    </TradingErrorBoundary>
  )

  WrappedComponent.displayName = `withTradingErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
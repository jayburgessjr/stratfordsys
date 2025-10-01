'use client'

/**
 * Global Error Boundary for Production Financial Application
 * Comprehensive error handling with monitoring integration
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { captureError, addBreadcrumb } from '@/lib/monitoring/error-tracking'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  retryCount: number
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Add breadcrumb for error context
    addBreadcrumb({
      category: 'user_action',
      message: 'Error boundary caught error',
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'GlobalErrorBoundary',
      },
    })

    // Capture error with monitoring system
    const errorId = captureError(error, {
      component: 'GlobalErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    })

    this.setState({
      errorInfo,
      errorId,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env['NODE_ENV'] === 'development') {
      console.error('Error Boundary caught an error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
    }
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetries) {
      addBreadcrumb({
        category: 'user_action',
        message: 'User clicked retry button',
        level: 'info',
        data: {
          retryCount: this.state.retryCount + 1,
          errorId: this.state.errorId,
        },
      })

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1,
      })
    }
  }

  private handleReload = (): void => {
    addBreadcrumb({
      category: 'user_action',
      message: 'User clicked reload page',
      level: 'info',
      data: {
        errorId: this.state.errorId,
      },
    })

    window.location.reload()
  }

  private handleHome = (): void => {
    addBreadcrumb({
      category: 'navigation',
      message: 'User navigated to home from error',
      level: 'info',
      data: {
        errorId: this.state.errorId,
      },
    })

    window.location.href = '/'
  }

  private handleReportIssue = (): void => {
    const { error, errorInfo, errorId } = this.state

    const issueDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }

    // Create GitHub issue URL or send to support system
    const githubUrl = `https://github.com/your-org/stratford-ai/issues/new?` +
      `title=${encodeURIComponent(`Error: ${error?.message || 'Unknown error'}`)}` +
      `&body=${encodeURIComponent(`## Error Report\n\n**Error ID:** ${errorId}\n\n**Details:**\n\`\`\`\n${JSON.stringify(issueDetails, null, 2)}\n\`\`\``)}`

    window.open(githubUrl, '_blank')

    addBreadcrumb({
      category: 'user_action',
      message: 'User reported issue',
      level: 'info',
      data: { errorId },
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId, retryCount } = this.state
      const canRetry = retryCount < this.maxRetries

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 text-center">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error in the Stratford AI application.
                Our team has been automatically notified.
              </p>
            </div>

            {process.env['NODE_ENV'] === 'development' && error && (
              <div className="mb-6 text-left">
                <details className="bg-gray-100 rounded p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-red-600">{error.message}</p>
                    {error.stack && (
                      <pre className="mt-2 overflow-auto text-gray-600 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            {errorId && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Error ID:</strong> {errorId}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please include this ID when reporting the issue
                </p>
              </div>
            )}

            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleHome}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </button>

              <button
                onClick={this.handleReportIssue}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Report Issue
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Stratford AI - Financial Trading Platform
              </p>
              <p className="text-xs text-gray-400 mt-1">
                If this problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
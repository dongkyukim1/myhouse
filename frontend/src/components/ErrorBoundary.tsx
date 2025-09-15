"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);

    // Send error to monitoring service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontFamily: 'Pretendard-Medium'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#dc2626' }}>
            🚨 오류가 발생했습니다
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#7f1d1d' }}>
            예상치 못한 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Pretendard-Medium'
            }}
          >
            페이지 새로고침
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '16px',
              textAlign: 'left',
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                개발자 정보 (개발 환경에서만 표시)
              </summary>
              <pre style={{
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                fontSize: '11px',
                color: '#374151'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle async errors
export function useErrorHandler() {
  return (error: Error) => {
    console.error('🚨 Async error caught:', error);

    // You can integrate with error reporting service here
    // e.g., Sentry.captureException(error);

    throw error; // Re-throw to trigger error boundary
  };
}

// Async error boundary for promises and async functions
export function withAsyncErrorBoundary<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('🚨 Async function error:', error);
      throw error;
    }
  }) as T;
}
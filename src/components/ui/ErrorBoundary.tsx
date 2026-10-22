import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Map as MapIcon } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onFallbackAction?: () => void;
  fallbackActionLabel?: string;
  showMapFallbackOption?: boolean;
  onSelectMapFallback?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Visualization runtime error captured by boundary:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Visualization Unavailable',
        fallbackDescription = 'This analytical visualization encountered an unexpected issue while rendering.',
        onFallbackAction,
        fallbackActionLabel = 'Retry Visualization',
        showMapFallbackOption = false,
        onSelectMapFallback,
      } = this.props;

      return (
        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-6 bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] text-center select-none">
          <div className="w-12 h-12 rounded-full bg-[var(--lm-color-warning)]/10 border border-[var(--lm-color-warning)]/30 flex items-center justify-center text-[var(--lm-color-warning)] mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-semibold text-[var(--lm-color-text-primary)] mb-1">
            {fallbackTitle}
          </h3>

          <p className="text-xs text-[var(--lm-color-text-secondary)] max-w-md mb-4 leading-relaxed">
            {fallbackDescription}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onFallbackAction || this.handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-strong)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{fallbackActionLabel}</span>
            </button>

            {showMapFallbackOption && onSelectMapFallback && (
              <button
                type="button"
                onClick={onSelectMapFallback}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-surface-raised)] transition-colors"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Switch to 2D Polar Map</span>
              </button>
            )}
          </div>

          {this.state.errorId && (
            <div className="mt-4 text-[10px] font-mono text-[var(--lm-color-text-muted)]">
              Diagnostic Reference: {this.state.errorId}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

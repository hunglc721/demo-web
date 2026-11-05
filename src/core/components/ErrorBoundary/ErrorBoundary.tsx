import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ErrorBoundaryProps, ErrorBoundaryState } from './types';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) return;

    if (this.props.resetKeys && prevProps.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasChanged) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error || new Error('Unknown error'),
            resetError: this.resetError,
          });
        }
        return this.props.fallback;
      }

      const isDev =
        Boolean((import.meta as any)?.env?.DEV) ||
        (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center bg-surface-card border border-border-base rounded-theme shadow-sm my-6">
          <div className="w-14 h-14 p-3 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-content-main mb-2">
            {this.props.title || 'Đã xảy ra sự cố không mong muốn'}
          </h3>

          <p className="text-sm text-content-muted max-w-md mb-6 leading-relaxed">
            {this.props.description ||
              'Trang gặp sự cố trong quá trình kết xuất giao diện. Bạn có thể thử tải lại hoặc quay về trang chủ để tiếp tục.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.resetError}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-theme bg-primary text-content-inverse hover:bg-primary-hover transition-colors shadow-sm gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>

            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-theme bg-surface-subtle text-content-main hover:bg-border-base border border-border-base transition-colors gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về trang chủ</span>
            </a>
          </div>

          {isDev && this.state.error && (
            <details className="mt-6 text-left w-full max-w-2xl bg-surface-subtle p-4 rounded-theme border border-border-base text-xs font-mono overflow-auto max-h-60">
              <summary className="cursor-pointer text-status-danger font-semibold font-sans mb-2">
                Chi tiết lỗi kỹ thuật (Chỉ hiển thị ở chế độ Phát triển)
              </summary>
              <p className="font-bold text-status-danger mb-1">{this.state.error.toString()}</p>
              <pre className="text-content-muted whitespace-pre-wrap">{this.state.error.stack}</pre>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-content-subtle whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

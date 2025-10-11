import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-8 max-w-lg text-center">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong.</h1>
                <p className="text-gray-300 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
                <details className="text-left bg-gray-800/50 p-4 rounded-md text-sm text-gray-400">
                    <summary className="cursor-pointer font-medium text-gray-300">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-all">
                        {this.state.error?.toString()}
                    </pre>
                </details>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

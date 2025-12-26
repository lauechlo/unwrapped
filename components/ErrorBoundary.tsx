"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-2xl text-center">
            {/* Error emoji */}
            <div className="text-6xl mb-6">😵‍💫</div>

            {/* Error message */}
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Oops! Something Broke
            </h1>

            <p className="text-xl text-gray-400 mb-8">
              We hit a snag analyzing your music. This is on us, not you!
            </p>

            {/* Error details (for debugging) */}
            {this.state.error && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 text-left">
                <p className="text-xs text-gray-500 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg
                         hover:opacity-90 transition-all shadow-lg"
              >
                Start Over
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg
                         transition-colors border border-zinc-700"
              >
                Try Again
              </button>
            </div>

            {/* Help text */}
            <p className="text-sm text-gray-600 mt-8">
              Still broken? Email <a href="mailto:hello@unwrapped.com" className="text-pink-400 hover:text-pink-300">hello@unwrapped.com</a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

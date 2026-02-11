import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Explicitly declare properties to satisfy strict TS
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // @ts-ignore
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white p-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-2xl w-full text-center space-y-4">
            <h1 className="text-3xl font-bold text-red-400">System Failure</h1>
            <p className="text-zinc-300">A critical error has occurred in the rendering pipeline.</p>

            <div className="bg-black/50 p-4 rounded text-left font-mono text-xs overflow-auto max-h-64 border border-red-500/20">
              <p className="text-red-300 mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre className="text-zinc-500">{this.state.errorInfo?.componentStack}</pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

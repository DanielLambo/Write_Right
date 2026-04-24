import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something broke.</h2>
          <p className="error-boundary-msg">{this.state.error?.message || 'Unknown error'}</p>
          <p className="error-boundary-hint">Your work is safe in the autosave file. Try reloading the app.</p>
          <button className="error-boundary-btn" onClick={this.handleReset}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

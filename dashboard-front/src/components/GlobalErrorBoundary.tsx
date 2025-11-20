// HIGHLIGHT: global error boundary

import React from "react";

type GlobalErrorBoundaryProps = {
  children: React.ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // HIGHLIGHT: send to backend
    void fetch("/api/v1/logs/client-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level: "error",
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        extra: {
          userAgent: window.navigator.userAgent,
          url: window.location.href,
        },
      }),
    }).catch(() => {
      // swallow
    });
  }

  render() {
    if (this.state.hasError) {
      // HIGHLIGHT: minimal but safe fallback
      return (
        <div style={{ padding: 24 }}>
          <h1>Something went wrong.</h1>
          <p>Please reload the page. If the problem persists, contact support.</p>
          {this.state.errorMessage && (
            <pre style={{ marginTop: 16 }}>{this.state.errorMessage}</pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
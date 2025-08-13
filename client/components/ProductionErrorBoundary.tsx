import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Only log detailed errors in development
    const isProduction = window.location.hostname.includes(".fly.dev");
    if (!isProduction) {
      console.error("Error caught by boundary:", error, errorInfo);
    } else {
      console.log("Application error occurred, check network connection");
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const isProduction = window.location.hostname.includes(".fly.dev");

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle className="text-xl">
                {isProduction
                  ? "Service Temporarily Unavailable"
                  : "Something went wrong"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {isProduction
                  ? "The service is temporarily unavailable. Please try refreshing the page or check back later."
                  : "An unexpected error occurred. Please refresh the page to continue."}
              </p>

              {!isProduction && this.state.error && (
                <details className="text-left text-xs bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleReset} variant="outline">
                  Try Again
                </Button>
              </div>

              {isProduction && (
                <p className="text-xs text-gray-500 mt-4">
                  If the problem persists, the service may be under maintenance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;

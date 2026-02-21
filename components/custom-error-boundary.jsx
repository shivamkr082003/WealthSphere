"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Database } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      detailsVisible: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error);
    this.setState({ error, errorInfo });
  }

  toggleDetails = () => {
    this.setState((prev) => ({ detailsVisible: !prev.detailsVisible }));
  };

  render() {
    if (this.state.hasError) {
      const isDbError =
        this.state.error?.message?.includes("Database") ||
        this.state.error?.message?.includes("Prisma") ||
        this.state.error?.message?.includes("connection") ||
        this.state.error?.message?.includes("timeout");

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {isDbError ? (
                  <Database className="h-12 w-12 text-orange-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                )}
              </div>
              <CardTitle className="text-xl">
                {isDbError
                  ? "Database Connection Issue"
                  : "Something went wrong"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                {isDbError
                  ? "The application is having trouble connecting to the database. This may be due to the Supabase free tier limitations."
                  : "An unexpected error occurred in the application."}
              </p>

              <div className="flex justify-center mt-6 space-x-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh Page
                </Button>
                <Button onClick={this.toggleDetails} variant="outline">
                  {this.state.detailsVisible ? "Hide" : "Show"} Error Details
                </Button>
              </div>

              {this.state.detailsVisible && (
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-48 text-left">
                    <p className="font-mono text-xs text-red-600 mb-2">
                      {this.state.error?.toString()}
                    </p>
                    <p className="font-mono text-xs text-gray-600">
                      {this.state.errorInfo?.componentStack ||
                        "No stack trace available"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

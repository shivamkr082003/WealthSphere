"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useEffect, useState } from "react";

export function DatabaseStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/ping");
      const data = await response.json();

      setStatus({
        success: data.status === "success",
        message: data.message,
        timestamp: data.timestamp,
      });
    } catch (err) {
      setStatus({
        success: false,
        message: "Failed to connect to database",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check database status on component mount
  useEffect(() => {
    checkDatabase();
  }, []);

  if (!status) return null;

  // Only show on error
  if (status.success) return null;

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-800 text-sm font-medium flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Database Status
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-amber-700 pt-0">
        <p className="mb-2">
          {status.success
            ? "Database connection is active"
            : "Database connection issue detected. This may affect app functionality."}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
          onClick={checkDatabase}
          disabled={loading}
        >
          {loading ? "Checking..." : "Reconnect Database"}
        </Button>
      </CardContent>
    </Card>
  );
}

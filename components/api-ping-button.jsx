"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database } from "lucide-react";

const ApiPingButton = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pingDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the safer dbcheck endpoint directly
      const response = await fetch("/api/dbcheck");
      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        // ignore JSON parse errors; we'll fall back to status text
      }

      if (!response.ok) {
        const msg =
          data?.message || `Server responded with status: ${response.status}`;
        setError(msg);
        setStatus({
          success: false,
          message: data?.message || "Connection failed",
          timestamp: data?.timestamp,
        });
        return;
      }

      setStatus({
        success: data?.status === "success" || data?.status === "ok",
        message: data?.message || "Success",
        timestamp: data?.timestamp,
      });
    } catch (err) {
      setError(err.message || "Failed to ping database");
      setStatus({
        success: false,
        message: "Connection failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Database Connection Status
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status && (
            <div
              className={`p-3 rounded-md ${status.success ? "bg-green-50" : "bg-red-50"}`}
            >
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${status.success ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <p
                  className={status.success ? "text-green-700" : "text-red-700"}
                >
                  {status.message}
                </p>
              </div>
              {status.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  Last checked: {new Date(status.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}

          <Button onClick={pingDatabase} disabled={loading} className="w-full">
            {loading ? "Pinging..." : "Ping Database"}
          </Button>

          <div className="text-xs text-gray-500 mt-2">
            <p>
              If your Supabase database is on the free tier, it may be paused
              after 7 days of inactivity. This button will help wake it up.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiPingButton;

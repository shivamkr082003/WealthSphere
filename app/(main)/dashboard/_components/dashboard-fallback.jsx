"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardFallback() {
  return (
    <div className="space-y-8">
      {/* Fallback for Database Status */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-800">
            Database Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700 pt-0">
          <p>Attempting to connect to database...</p>
        </CardContent>
      </Card>

      {/* Fallback for Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="flex justify-between mt-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Fallback for Dashboard Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Fallback for Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-32 pt-5">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="h-32">
          <CardContent className="p-0">
            <div className="h-full w-full bg-gray-200 animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="h-32">
          <CardContent className="p-0">
            <div className="h-full w-full bg-gray-200 animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

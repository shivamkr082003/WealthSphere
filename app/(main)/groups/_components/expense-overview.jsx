"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  Calculator,
} from "lucide-react";

export function ExpenseOverview({
  groupDetails,
  balances,
  totalExpenses,
  currentUserId,
}) {
  // Find current user's balance
  const currentUserBalance = balances.find(
    (balance) => balance.user.id === currentUserId
  );

  const totalMembers =
    groupDetails.members.length + (groupDetails.anonymousMembers?.length || 0);
  const averagePerPerson = totalMembers > 0 ? totalExpenses / totalMembers : 0;

  return (
    <div className="space-y-6">
      {/* KittySplit-style Summary */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            {groupDetails.name} - Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Group Cost</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(averagePerPerson)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Cost per Person</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {totalMembers}
              </div>
              <div className="text-sm text-gray-600 mt-1">Members</div>
            </div>
          </div>

          {/* Current User Summary */}
          {currentUserBalance && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUserBalance.user.imageUrl}
                    alt={currentUserBalance.user.name}
                  />
                  <AvatarFallback>
                    {currentUserBalance.user.name?.charAt(0) ||
                      currentUserBalance.user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                Your Summary
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(currentUserBalance.totalPaid || 0)}
                  </div>
                  <div className="text-sm text-gray-600">You've Paid</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(currentUserBalance.totalOwed || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Your Share</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      currentUserBalance.netBalance > 0
                        ? "text-green-600"
                        : currentUserBalance.netBalance < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {currentUserBalance.netBalance > 0 && "+"}
                    {formatCurrency(
                      Math.abs(currentUserBalance.netBalance || 0)
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentUserBalance.netBalance > 0
                      ? "You are Owed"
                      : currentUserBalance.netBalance < 0
                        ? "You Owe"
                        : "Settled Up"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {balances.map((balance) => (
              <div
                key={balance.user.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  balance.user.id === currentUserId
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={balance.user.imageUrl}
                      alt={balance.user.name}
                    />
                    <AvatarFallback>
                      {balance.user.name?.charAt(0) ||
                        balance.user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {balance.user.name || balance.user.email}
                      {balance.user.id === currentUserId && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Paid {formatCurrency(balance.totalPaid || 0)}
                      {balance.netBalance < 0 && (
                        <span>
                          {" "}
                          • Owes {formatCurrency(balance.totalOwed || 0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold ${
                      balance.netBalance > 0
                        ? "text-green-600"
                        : balance.netBalance < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {balance.netBalance > 0 && "+"}
                    {formatCurrency(Math.abs(balance.netBalance || 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.abs(balance.netBalance || 0) < 0.01
                      ? "Settled"
                      : balance.netBalance > 0
                        ? "Gets back"
                        : "Owes"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

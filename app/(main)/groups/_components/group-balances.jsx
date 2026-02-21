"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  Equal,
  ArrowRight,
} from "lucide-react";

// Function to calculate minimal settlement transactions
function calculateSettlements(balances) {
  const settlements = [];
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ ...b, balance: Math.abs(b.netBalance) }))
    .sort((a, b) => b.balance - a.balance);
  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ ...b, balance: b.netBalance }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0.01) {
      // Avoid tiny settlements
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: Number(amount.toFixed(2)),
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return settlements;
}

export function GroupBalances({ balances }) {
  const positiveBalances = balances.filter((b) => b.netBalance > 0);
  const negativeBalances = balances.filter((b) => b.netBalance < 0);
  const zeroBalances = balances.filter((b) => Math.abs(b.netBalance) < 0.01);

  const settlements = calculateSettlements(balances);
  const hasUnbalancedUsers =
    positiveBalances.length > 0 || negativeBalances.length > 0;

  return (
    <div className="space-y-6">
      {/* Settlement Suggestions */}
      {hasUnbalancedUsers && settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-600 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Suggested Settlements
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Minimal transactions to settle all balances
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={settlement.from.imageUrl}
                      alt={settlement.from.name}
                    />
                    <AvatarFallback className="text-xs">
                      {settlement.from.name?.charAt(0) ||
                        settlement.from.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {settlement.from.name || settlement.from.email}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={settlement.to.imageUrl}
                      alt={settlement.to.name}
                    />
                    <AvatarFallback className="text-xs">
                      {settlement.to.name?.charAt(0) ||
                        settlement.to.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {settlement.to.name || settlement.to.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-blue-600">
                    {formatCurrency(settlement.amount)}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Mark Paid
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* People who are owed money */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              Getting Back ({positiveBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {positiveBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one is owed money
              </p>
            ) : (
              positiveBalances.map((balance) => (
                <div
                  key={balance.user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={balance.user.imageUrl}
                        alt={balance.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {balance.user.name?.charAt(0) ||
                          balance.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {balance.user.name || balance.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid {formatCurrency(balance.totalPaid)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    +{formatCurrency(balance.netBalance)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* People who owe money */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <ArrowDown className="h-4 w-4" />
              Owes Money ({negativeBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {negativeBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one owes money</p>
            ) : (
              negativeBalances.map((balance) => (
                <div
                  key={balance.user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={balance.user.imageUrl}
                        alt={balance.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {balance.user.name?.charAt(0) ||
                          balance.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {balance.user.name || balance.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Owes {formatCurrency(balance.totalOwed)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {formatCurrency(Math.abs(balance.netBalance))}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* People who are settled */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Equal className="h-4 w-4" />
              Settled Up ({zeroBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zeroBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one is settled up
              </p>
            ) : (
              zeroBalances.map((balance) => (
                <div
                  key={balance.user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={balance.user.imageUrl}
                        alt={balance.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {balance.user.name?.charAt(0) ||
                          balance.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {balance.user.name || balance.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All settled
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-gray-500">
                    {formatCurrency(0)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

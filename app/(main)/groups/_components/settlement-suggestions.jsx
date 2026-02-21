"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Handshake,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { recordSettlementPayment } from "@/actions/expenses";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

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

export function SettlementSuggestions({ balances, groupId, currentUserId }) {
  const [completedSettlements, setCompletedSettlements] = useState(new Set());

  const { loading: recordPaymentLoading, fn: recordPaymentFn } = useFetch(
    recordSettlementPayment
  );

  const settlements = calculateSettlements(balances);
  const hasDebts = settlements.length > 0;

  const handleMarkPaid = async (settlement) => {
    try {
      await recordPaymentFn(
        settlement.from.id,
        settlement.to.id,
        settlement.amount,
        groupId
      );

      // Add to completed settlements
      const settlementKey = `${settlement.from.id}-${settlement.to.id}-${settlement.amount}`;
      setCompletedSettlements((prev) => new Set([...prev, settlementKey]));

      toast.success("Payment recorded successfully!");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  };

  const isSettlementCompleted = (settlement) => {
    const settlementKey = `${settlement.from.id}-${settlement.to.id}-${settlement.amount}`;
    return completedSettlements.has(settlementKey);
  };

  if (!hasDebts) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">
            All Settled Up!
          </h3>
          <p className="text-green-700 text-center">
            Everyone in this group is all settled up. No money needs to change
            hands.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-orange-900 flex items-center gap-2">
          <Handshake className="h-6 w-6" />
          How to Settle All Debts
        </CardTitle>
        <p className="text-orange-700">
          Here's the simplest way to settle all balances with{" "}
          {settlements.length} transaction{settlements.length !== 1 ? "s" : ""}:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {settlements.map((settlement, index) => (
          <div
            key={index}
            className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* From User */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-red-200">
                    <AvatarImage
                      src={settlement.from.imageUrl}
                      alt={settlement.from.name}
                    />
                    <AvatarFallback className="bg-red-100 text-red-700">
                      {settlement.from.name?.charAt(0) ||
                        settlement.from.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-red-700">
                      {settlement.from.name || settlement.from.email}
                    </div>
                    <div className="text-sm text-red-600">Pays</div>
                  </div>
                </div>

                {/* Arrow and Amount */}
                <div className="flex items-center gap-3 px-4">
                  <ArrowRight className="h-6 w-6 text-orange-600" />
                  <Badge className="bg-orange-600 text-white text-lg px-3 py-1">
                    {formatCurrency(settlement.amount)}
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-orange-600" />
                </div>

                {/* To User */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-green-200">
                    <AvatarImage
                      src={settlement.to.imageUrl}
                      alt={settlement.to.name}
                    />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {settlement.to.name?.charAt(0) ||
                        settlement.to.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-green-700">
                      {settlement.to.name || settlement.to.email}
                    </div>
                    <div className="text-sm text-green-600">Receives</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="ml-4">
                {isSettlementCompleted(settlement) ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Paid
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => handleMarkPaid(settlement)}
                    disabled={recordPaymentLoading}
                  >
                    {recordPaymentLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Summary */}
        <div className="mt-6 p-4 bg-orange-100 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-800">
              Settlement Summary
            </span>
          </div>
          <p className="text-sm text-orange-700">
            After these {settlements.length} payment
            {settlements.length !== 1 ? "s" : ""}, everyone will be settled up
            and all debts will be cleared.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
